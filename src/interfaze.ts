import type {
  BoundingBox,
  DetectedElement,
  InterfazeClient,
  InterfazeClientOptions,
  NextStepResult,
} from "./types";

const DEFAULT_BASE_URL = "https://api.interfaze.ai/v1";
const DEFAULT_MODEL = "interfaze-beta";

const EMPTY_SCHEMA = {
  type: "json_schema" as const,
  json_schema: {
    name: "empty_schema",
    schema: {},
  },
};

const NEXT_STEP_SCHEMA = {
  type: "json_schema" as const,
  json_schema: {
    name: "next_step",
    schema: {
      type: "object",
      properties: {
        done: { type: "boolean" },
        instruction: { type: "string" },
        topLeftX: { type: "number" },
        topLeftY: { type: "number" },
        bottomRightX: { type: "number" },
        bottomRightY: { type: "number" },
      },
      required: [
        "done",
        "instruction",
        "topLeftX",
        "topLeftY",
        "bottomRightX",
        "bottomRightY",
      ],
    },
  },
};

// --- internal helpers ---

function scrubLargeFields(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(scrubLargeFields);

  if (!value || typeof value !== "object") {
    if (typeof value === "string" && value.length > 1800)
      return `<long-string length=${value.length}>`;
    return value;
  }

  const result: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (
      (key === "file_data" || key === "url") &&
      typeof nested === "string" &&
      nested.startsWith("data:")
    ) {
      result[key] = `<data-url length=${nested.length}>`;
      continue;
    }
    if (typeof nested === "string" && nested.length > 1800) {
      result[key] = `<long-string length=${nested.length}>`;
      continue;
    }
    result[key] = scrubLargeFields(nested);
  }
  return result;
}

function extractMessageText(content: unknown): string {
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (
          part &&
          typeof part === "object" &&
          "text" in part &&
          typeof (part as { text?: unknown }).text === "string"
        )
          return (part as { text: string }).text;
        return "";
      })
      .join("\n");
  }

  return "";
}

function parseMaybeJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    const firstBrace = value.indexOf("{");
    const lastBrace = value.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace)
      return null;
    try {
      return JSON.parse(value.slice(firstBrace, lastBrace + 1));
    } catch {
      return null;
    }
  }
}

function parseStructuredContent<T>(raw: Record<string, unknown>): T {
  const choices = raw.choices as
    | Array<{ message?: { content?: unknown } }>
    | undefined;
  const content = choices?.[0]?.message?.content;
  const text = extractMessageText(content).trim();
  if (!text) throw new Error("Empty response from Interfaze.");

  const parsed = parseMaybeJson(text);
  if (!parsed || typeof parsed !== "object")
    throw new Error("Failed to parse structured response.");
  return parsed as T;
}

// --- STT helpers ---

function pickTranscript(result: unknown): string {
  if (!result || typeof result !== "object") return "";
  const r = result as Record<string, unknown>;
  const direct =
    (typeof r.text === "string" && r.text) ||
    (typeof r.transcript === "string" && r.transcript) ||
    (typeof r.transcription === "string" && r.transcription);
  return direct ? direct.trim() : "";
}

function extractSttTranscript(raw: Record<string, unknown>): string {
  const parsed = parseStructuredContent<Record<string, unknown>>(raw);

  const precontexts: Array<{ name?: string; result?: unknown }> = [];
  for (const source of [raw.precontext, parsed.precontext]) {
    if (Array.isArray(source))
      precontexts.push(
        ...(source as Array<{ name?: string; result?: unknown }>),
      );
  }

  const sttNames = new Set(["speech_to_text", "stt"]);
  const match = precontexts.find((p) => p.name && sttNames.has(p.name));
  if (match) {
    const t = pickTranscript(match.result);
    if (t) return t;
  }

  return pickTranscript(parsed);
}

// --- gui_elements extraction for task mode ---

function safeNum(v: unknown): number | undefined {
  return typeof v === "number" ? v : undefined;
}

function extractBounds(el: Record<string, unknown>): {
  topLeftX: number;
  topLeftY: number;
  bottomRightX: number;
  bottomRightY: number;
} | null {
  const bounds = el.bounds as Record<string, unknown> | undefined;

  if (bounds && typeof bounds === "object") {
    const tl = bounds.top_left as Record<string, unknown> | undefined;
    const br = bounds.bottom_right as Record<string, unknown> | undefined;

    if (tl && br) {
      const topLeftX = safeNum(tl.x);
      const topLeftY = safeNum(tl.y);
      const bottomRightX = safeNum(br.x);
      const bottomRightY = safeNum(br.y);

      if (
        topLeftX !== undefined &&
        topLeftY !== undefined &&
        bottomRightX !== undefined &&
        bottomRightY !== undefined
      ) {
        return { topLeftX, topLeftY, bottomRightX, bottomRightY };
      }
    }
  }

  const topLeftX = safeNum(el.top_left_x);
  const topLeftY = safeNum(el.top_left_y);
  const bottomRightX = safeNum(el.bottom_right_x);
  const bottomRightY = safeNum(el.bottom_right_y);
  if (
    topLeftX !== undefined &&
    topLeftY !== undefined &&
    bottomRightX !== undefined &&
    bottomRightY !== undefined
  ) {
    return { topLeftX, topLeftY, bottomRightX, bottomRightY };
  }

  return null;
}

function findAnnotatedImage(
  raw: Record<string, unknown>,
  parsed: Record<string, unknown>,
): string | null {
  const candidates = [
    parsed.annotated_image,
    (parsed.result as Record<string, unknown> | undefined)?.annotated_image,
    (parsed.object as Record<string, unknown> | undefined)?.annotated_image,
    (
      (parsed.object as Record<string, unknown> | undefined)?.result as
        | Record<string, unknown>
        | undefined
    )?.annotated_image,
    raw.annotated_image,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.length > 0) return c;
  }

  const choices = raw.choices as
    | Array<{ message?: { content?: unknown } }>
    | undefined;
  const content = choices?.[0]?.message?.content;
  if (Array.isArray(content)) {
    for (const part of content) {
      if (
        part &&
        typeof part === "object" &&
        "type" in part &&
        (part as { type: string }).type === "image_url"
      ) {
        const url = (part as { image_url?: { url?: string } }).image_url?.url;
        if (typeof url === "string" && url.length > 0) return url;
      }
    }
  }

  return null;
}

function extractGuiElements(
  parsed: Record<string, unknown>,
): DetectedElement[] {
  let guiElements: unknown[] | undefined;

  const result = parsed.result as Record<string, unknown> | undefined;
  if (result && Array.isArray(result.gui_elements)) {
    guiElements = result.gui_elements as unknown[];
  }

  if (!guiElements) {
    const obj = parsed.object as Record<string, unknown> | undefined;
    const objResult = obj?.result as Record<string, unknown> | undefined;
    if (objResult && Array.isArray(objResult.gui_elements)) {
      guiElements = objResult.gui_elements as unknown[];
    }
  }

  if (!guiElements) return [];

  const out: DetectedElement[] = [];
  for (const raw of guiElements) {
    if (!raw || typeof raw !== "object") continue;
    const el = raw as Record<string, unknown>;

    const b = extractBounds(el);
    if (!b) continue;
    if (b.bottomRightX <= b.topLeftX || b.bottomRightY <= b.topLeftY) continue;

    out.push({
      type: typeof el.type === "string" ? el.type : "element",
      topLeftX: b.topLeftX,
      topLeftY: b.topLeftY,
      bottomRightX: b.bottomRightX,
      bottomRightY: b.bottomRightY,
    });
  }

  return out;
}

// --- factory ---

export function createInterfazeClient(
  apiKey: string,
  options: InterfazeClientOptions = {},
): InterfazeClient {
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  const model = options.model ?? DEFAULT_MODEL;
  const debugEnabled = Boolean(options.debug);
  let requestCounter = 0;

  function logRaw(event: string, payload: unknown): void {
    if (!debugEnabled) return;
    console.log("[clippy-web]", event, payload); // eslint-disable-line no-console

    if (typeof window === "undefined") return;
    const w = window as Window & {
      __CLIPPY_WEB_DEBUG__?: { events: Array<Record<string, unknown>> };
    };
    if (!w.__CLIPPY_WEB_DEBUG__) w.__CLIPPY_WEB_DEBUG__ = { events: [] };
    const store = w.__CLIPPY_WEB_DEBUG__.events;
    store.push({
      at: new Date().toISOString(),
      source: "interfaze",
      event,
      payload,
    });
    if (store.length > 500) store.shift();
  }

  async function createCompletion(
    payload: Record<string, unknown>,
    debugLabel = "chat_completion",
  ): Promise<Record<string, unknown>> {
    const id = ++requestCounter;
    logRaw(`${debugLabel}.request`, {
      id,
      payload: scrubLargeFields(payload),
    });

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data: Record<string, unknown>;
      try {
        data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
      } catch {
        data = { raw_text: text };
      }

      logRaw(`${debugLabel}.response`, {
        id,
        status: res.status,
        ok: res.ok,
        data: scrubLargeFields(data),
      });

      if (!res.ok) {
        const msg =
          (data.error as { message?: string } | undefined)?.message ??
          `Interfaze request failed with ${res.status}`;
        throw new Error(msg);
      }

      return data;
    } catch (error) {
      logRaw(`${debugLabel}.error`, {
        id,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // --- public methods ---

  async function transcribeAudioDataUrl(
    dataUrl: string,
    filename = "question.webm",
  ): Promise<string> {
    try {
      const raw = await createCompletion(
        {
          model,
          temperature: 0,
          messages: [
            { role: "system", content: "<task>speech_to_text</task>" },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Transcribe this audio file and return only the spoken content.",
                },
                { type: "file", file: { filename, file_data: dataUrl } },
              ],
            },
          ],
          response_format: EMPTY_SCHEMA,
        },
        "speech_to_text",
      );

      const transcript = extractSttTranscript(raw);
      logRaw("speech_to_text.parsed", { transcript });
      if (transcript) return transcript;
    } catch {
      // fallback below
    }

    const raw = await createCompletion(
      {
        model,
        temperature: 0,
        messages: [
          {
            role: "system",
            content: 'Return strict JSON: {"text":"..."}',
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Transcribe this audio file." },
              { type: "file", file: { filename, file_data: dataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      },
      "speech_to_text.fallback",
    );

    const parsed = parseStructuredContent<Record<string, unknown>>(raw);
    const transcript = pickTranscript(parsed);
    if (!transcript) throw new Error("No transcript returned by Interfaze.");
    return transcript;
  }

  async function getNextStep(
    imageDataUrl: string,
    goal: string,
    completedSteps?: string[],
  ): Promise<NextStepResult> {
    const completedContext =
      completedSteps && completedSteps.length > 0
        ? `\nAlready completed:\n${completedSteps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`
        : "";

    const raw = await createCompletion(
      {
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a UI guide assistant. Given a screenshot and the user's goal, determine the next single UI element the user should interact with. Return the bounding box of that element in image coordinates. If the goal is already complete, set done to true.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `User goal: ${goal}${completedContext}\n\nWhat is the next single element the user should interact with?`,
              },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
        response_format: NEXT_STEP_SCHEMA,
      },
      "next_step",
    );

    const parsed = parseStructuredContent<Record<string, unknown>>(raw);

    const done = parsed.done === true;
    const instruction =
      typeof parsed.instruction === "string" ? parsed.instruction : "";

    let target: BoundingBox | null = null;
    if (!done) {
      const tlx = safeNum(parsed.topLeftX);
      const tly = safeNum(parsed.topLeftY);
      const brx = safeNum(parsed.bottomRightX);
      const bry = safeNum(parsed.bottomRightY);

      if (
        tlx !== undefined &&
        tly !== undefined &&
        brx !== undefined &&
        bry !== undefined &&
        brx > tlx &&
        bry > tly
      ) {
        target = {
          topLeftX: tlx,
          topLeftY: tly,
          bottomRightX: brx,
          bottomRightY: bry,
        };
      }
    }

    const annotatedImage = findAnnotatedImage(raw, parsed);

    logRaw("next_step.parsed", {
      done,
      instruction,
      target,
      hasAnnotatedImage: !!annotatedImage,
    });

    if (annotatedImage && debugEnabled) {
      console.log("[clippy-web] next_step.annotated_image:"); // eslint-disable-line no-console
      console.log(
        "%c ",
        `font-size:1px; padding:150px 200px; background:url(${annotatedImage}) no-repeat center/contain`,
      ); // eslint-disable-line no-console
    }

    return { done, instruction, target };
  }

  async function detectElements(
    imageDataUrl: string,
  ): Promise<DetectedElement[]> {
    const raw = await createCompletion(
      {
        model,
        messages: [
          { role: "system", content: "<task>gui_detection</task>" },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Detect all interactive UI elements on this screen",
              },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
        response_format: EMPTY_SCHEMA,
      },
      "gui_detection",
    );

    const parsed = parseStructuredContent<Record<string, unknown>>(raw);
    const elements = extractGuiElements(parsed);

    const annotatedImage = findAnnotatedImage(raw, parsed);

    logRaw("gui_detection.parsed", {
      count: elements.length,
      hasAnnotatedImage: !!annotatedImage,
    });

    if (annotatedImage && debugEnabled) {
      console.log("[clippy-web] gui_detection.annotated_image:"); // eslint-disable-line no-console
      console.log(
        "%c ",
        `font-size:1px; padding:150px 200px; background:url(${annotatedImage}) no-repeat center/contain`,
      ); // eslint-disable-line no-console
    }

    return elements;
  }

  return { transcribeAudioDataUrl, getNextStep, detectElements };
}
