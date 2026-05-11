import type { Plan, Step } from "./types";
import { PlanSchema } from "./types";
import { buildDomTree, takeScreenshot, getPageMeta } from "./snapshot";

const BASE_URL = "https://api.interfaze.ai/v1";
const MODEL = "interfaze-beta";

const PLAN_SYSTEM_PROMPT = `You are a UI guidance assistant. You guide users through a web interface by pointing them to elements they should interact with. You NEVER perform actions for the user — you only show them where to go and what to do.

Rules:
- Each step points to ONE element from the domTree using its id.
- The instruction tells the user what to do with that element (click it, type something into it, etc). The user performs the action themselves.
- Set completesGoal=true if the last step in your array will fully achieve the user's goal. Set it to false if more steps will be needed after a page change or DOM update.
- If a step's target has visible=false, instruct the user to scroll to find it. Use the target's rect vs viewport to say which direction.
- Keep instructions concise and friendly (1-2 short sentences).
- Pick ONE direct route to achieve the goal. Do not suggest alternatives.
- Plan ALL remaining steps needed to complete the user's goal.
- If a previousPlan is provided, look at the completedSteps to understand what was already done. Do NOT repeat completed actions.
- Only suggest steps that are visible on the page and in the domTree.
- Don't suggest steps that are already completed.
`;

const PLAN_JSON_SCHEMA = {
  name: "plan",
  strict: true,
  schema: {
    type: "object",
    required: ["steps", "completesGoal"],
    additionalProperties: false,
    properties: {
      steps: {
        type: "array",
        items: {
          type: "object",
          required: ["targetId", "instruction"],
          additionalProperties: false,
          properties: {
            targetId: { type: "string" },
            instruction: { type: "string" },
          },
        },
      },
      completesGoal: { type: "boolean" },
    },
  },
};

interface FetchPlanOpts {
  question: string;
  previousPlan?: { completedSteps: Step[]; remainingSteps: Step[] };
  signal?: AbortSignal;
}

export async function fetchPlan(
  apiKey: string,
  opts: FetchPlanOpts,
): Promise<{ plan: Plan; cleanup: () => void } | null> {
  const { domTree, cleanup } = buildDomTree();
  const { screenshot, screenshotKind } = await takeScreenshot();

  const meta = getPageMeta();

  const textParts = [
    `Question: ${opts.question}`,
    `URL: ${meta.url}`,
    `Viewport: ${meta.viewport.w}x${meta.viewport.h} (scroll: ${meta.viewport.scrollX},${meta.viewport.scrollY})`,
    `Document: ${meta.documentSize.w}x${meta.documentSize.h}`,
    `Screenshot: ${screenshotKind}`,
    `DOM (${domTree.length} elements):`,
    JSON.stringify(domTree),
  ];

  if (opts.previousPlan) {
    textParts.push(
      "",
      "PreviousPlan (continue from here, do not repeat completed steps):",
      `Completed: ${JSON.stringify(opts.previousPlan.completedSteps)}`,
      `Remaining (may be outdated): ${JSON.stringify(opts.previousPlan.remainingSteps)}`,
    );
  }

  const userContent: any[] = [{ type: "text", text: textParts.join("\n") }];
  if (screenshot) {
    userContent.push({ type: "image_url", image_url: { url: screenshot } });
  }

  const resp = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: PLAN_SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_schema", json_schema: PLAN_JSON_SCHEMA },
    }),
    signal: opts.signal,
  });

  if (!resp.ok) {
    console.error(
      "[clippy] Interfaze API error:",
      resp.status,
      await resp.text().catch(() => ""),
    );
    cleanup();
    return null;
  }

  const data = await resp.json();
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) {
    cleanup();
    return null;
  }

  const content = stripCodeFences(raw);

  try {
    const parsed = JSON.parse(content);
    const result = PlanSchema.safeParse(parsed);
    if (result.success) return { plan: result.data, cleanup };
    console.error("[clippy] Plan schema validation failed:", result.error);
    cleanup();
    return null;
  } catch {
    console.error("[clippy] Failed to parse plan JSON:", content);
    cleanup();
    return null;
  }
}

export async function transcribeAudio(
  apiKey: string,
  audioBase64: string,
  filename: string,
): Promise<string> {
  const ext = filename.split(".").pop() || "webm";

  const resp = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "<task>speech_to_text</task>",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Transcribe the audio file. The recording is in English.",
            },
            {
              type: "input_audio",
              input_audio: {
                data: stripDataUrlPrefix(audioBase64),
                format: ext,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!resp.ok) {
    console.error(
      "[clippy] Transcribe API error:",
      resp.status,
      await resp.text().catch(() => ""),
    );
    return "";
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || "";

  try {
    const parsed = JSON.parse(content);
    if (parsed.result?.text) return parsed.result.text;
    if (parsed.result?.error) {
      console.error("[clippy] STT error:", parsed.result.error.message);
      return "";
    }
    if (parsed.text) return parsed.text;
    return "";
  } catch {
    return content;
  }
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```(?:\w*)\n([\s\S]*?)\n```$/);
  return match ? match[1] : trimmed;
}

function stripDataUrlPrefix(base64: string): string {
  const idx = base64.indexOf(",");
  return idx >= 0 ? base64.slice(idx + 1) : base64;
}
