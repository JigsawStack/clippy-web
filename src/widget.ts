import { toJpeg } from "html-to-image";
import { createInterfazeClient } from "./interfaze";
import { snapTargetToDom } from "./snap-to-dom";
import type {
  BoundingBox,
  ClippyWebConfig,
  ClippyWebHandle,
  DetectedElement,
  InterfazeClient,
  NextStepResult,
  ViewportSnapshot,
} from "./types";
import {
  blobToDataUrl,
  centerOf,
  clamp,
  isPointInsideBox,
  pickRecorderMimeType,
  scaleBox,
} from "./utils";

const DEFAULTS = {
  baseUrl: "https://api.interfaze.ai/v1",
  model: "interfaze-beta",
  observeIntervalMs: 3500,
  screenshotScale: 1,
  screenshotQuality: 0.75,
  bubbleMaxWidth: 320,
  replanAfterMissingDetections: 3,
  snapToDom: true,
  debug: false,
} as const;

const CLICK_TOLERANCE = 18;
const IOU_THRESHOLD = 0.15;

type ResolvedConfig = Required<
  Omit<ClippyWebConfig, "onTranscript" | "onError">
> &
  Pick<ClippyWebConfig, "onTranscript" | "onError">;

function resolveConfig(config: ClippyWebConfig): ResolvedConfig {
  return {
    baseUrl: config.baseUrl ?? DEFAULTS.baseUrl,
    model: config.model ?? DEFAULTS.model,
    observeIntervalMs: config.observeIntervalMs ?? DEFAULTS.observeIntervalMs,
    screenshotScale: config.screenshotScale ?? DEFAULTS.screenshotScale,
    screenshotQuality:
      config.screenshotQuality ?? DEFAULTS.screenshotQuality,
    bubbleMaxWidth: config.bubbleMaxWidth ?? DEFAULTS.bubbleMaxWidth,
    replanAfterMissingDetections:
      config.replanAfterMissingDetections ??
      DEFAULTS.replanAfterMissingDetections,
    snapToDom: config.snapToDom ?? DEFAULTS.snapToDom,
    debug: Boolean(config.debug ?? DEFAULTS.debug),
    onTranscript: config.onTranscript,
    onError: config.onError,
  };
}


function mountOverlay(bubbleMaxWidth: number) {
  const overlay = document.createElement("div");
  overlay.className = "clippy-web-overlay";
  overlay.dataset.clippyWebIgnore = "true";
  overlay.dataset.html2canvasIgnore = "true";

  const cursor = document.createElement("div");
  cursor.className = "clippy-web-cursor";

  const bubble = document.createElement("div");
  bubble.className = "clippy-web-bubble";
  bubble.style.maxWidth = `${bubbleMaxWidth}px`;

  const status = document.createElement("div");
  status.className = "clippy-web-status";

  const highlight = document.createElement("div");
  highlight.className = "clippy-web-highlight";

  const inputBar = document.createElement("div");
  inputBar.className = "clippy-web-input-bar";
  inputBar.dataset.clippyWebIgnore = "true";
  inputBar.dataset.html2canvasIgnore = "true";

  const textForm = document.createElement("form");
  textForm.className = "clippy-web-text-form";
  textForm.autocomplete = "off";

  const textInput = document.createElement("input");
  textInput.className = "clippy-web-text-input";
  textInput.type = "text";
  textInput.placeholder = "Ask how to do something...";
  textInput.dataset.clippyWebIgnore = "true";

  const textSubmit = document.createElement("button");
  textSubmit.className = "clippy-web-text-submit";
  textSubmit.type = "submit";
  textSubmit.textContent = "Go";

  textForm.append(textInput, textSubmit);

  const recordButton = document.createElement("button");
  recordButton.className = "clippy-web-record-toggle";
  recordButton.type = "button";

  inputBar.append(textForm, recordButton);

  overlay.append(highlight, cursor, bubble, status, inputBar);
  document.body.appendChild(overlay);

  return {
    overlay,
    cursor,
    bubble,
    status,
    highlight,
    inputBar,
    textForm,
    textInput,
    textSubmit,
    recordButton,
  };
}

async function captureViewport(
  screenshotScale: number,
  screenshotQuality: number,
): Promise<ViewportSnapshot> {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;
  const scale = clamp(screenshotScale, 0.35, 1);
  const quality = clamp(screenshotQuality, 0.4, 0.95);

  const imageDataUrl = await toJpeg(document.documentElement, {
    quality,
    pixelRatio: scale,
    cacheBust: true,
    backgroundColor: "#ffffff",
    width: viewportWidth,
    height: viewportHeight,
    style: {
      transform: `translate(${-scrollX}px, ${-scrollY}px)`,
      transformOrigin: "top left",
      overflow: "hidden",
    },
    filter: (domNode: HTMLElement) => {
      if (!domNode) return true;
      if (domNode.dataset?.clippyWebIgnore === "true") return false;
      if (domNode.classList?.contains("clippy-web-overlay")) return false;
      return !domNode.closest?.("[data-clippy-web-ignore='true']");
    },
  });

  return {
    imageDataUrl,
    scale,
    viewportWidth,
    viewportHeight,
    scrollX,
    scrollY,
  };
}

// --- geometry helpers ---

function intersectionOverUnion(a: BoundingBox, b: BoundingBox): number {
  const interLeft = Math.max(a.topLeftX, b.topLeftX);
  const interTop = Math.max(a.topLeftY, b.topLeftY);
  const interRight = Math.min(a.bottomRightX, b.bottomRightX);
  const interBottom = Math.min(a.bottomRightY, b.bottomRightY);

  if (interRight <= interLeft || interBottom <= interTop) return 0;

  const interArea = (interRight - interLeft) * (interBottom - interTop);
  const areaA = Math.max(
    1,
    (a.bottomRightX - a.topLeftX) * (a.bottomRightY - a.topLeftY),
  );
  const areaB = Math.max(
    1,
    (b.bottomRightX - b.topLeftX) * (b.bottomRightY - b.topLeftY),
  );
  return interArea / (areaA + areaB - interArea);
}

function findMatchingBox(
  elements: DetectedElement[],
  target: BoundingBox,
): BoundingBox | null {
  let best: { score: number; box: BoundingBox } | null = null;

  for (const el of elements) {
    const elBox: BoundingBox = {
      topLeftX: el.topLeftX,
      topLeftY: el.topLeftY,
      bottomRightX: el.bottomRightX,
      bottomRightY: el.bottomRightY,
    };

    const iou = intersectionOverUnion(target, elBox);
    if (iou > (best?.score ?? 0) && iou >= IOU_THRESHOLD) {
      best = { score: iou, box: elBox };
    }
  }

  return best?.box ?? null;
}

// --- widget ---

export function createWidget(
  apiKey: string,
  config: ClippyWebConfig = {},
): ClippyWebHandle {
  if (!apiKey?.trim()) {
    throw new Error("ClippyWeb requires an Interfaze API key.");
  }

  const trimmedKey = apiKey.trim();
  const cfg = resolveConfig(config);

  const client: InterfazeClient = createInterfazeClient(trimmedKey, {
    baseUrl: cfg.baseUrl,
    model: cfg.model,
    debug: cfg.debug,
  });

  const dom = mountOverlay(cfg.bubbleMaxWidth);

  // --- mutable state ---
  let realPointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let observeTimer: number | null = null;
  let observationRunning = false;

  let mediaRecorder: MediaRecorder | null = null;
  let mediaStream: MediaStream | null = null;
  let mediaChunks: Blob[] = [];
  let isRecording = false;
  let isProcessingRecording = false;

  let goal = "";
  let active = false;
  let currentTargetRaw: BoundingBox | null = null;
  let currentTargetBox: BoundingBox | null = null;
  let completedSteps: string[] = [];
  let stepNumber = 0;
  let lastSnapshotScale = 1;
  let missingTargetDetections = 0;
  let stepStartedAt = 0;
  let lastInteractionAt = 0;
  let observeIteration = 0;
  let advancing = false;
  let lastInstruction = "";

  // --- DOM helpers ---

  function setStatus(text: string): void {
    dom.status.textContent = text;
  }

  function positionBubble(x: number, y: number): void {
    const margin = 10;
    const bubbleWidth = dom.bubble.offsetWidth || cfg.bubbleMaxWidth;
    const bubbleHeight = dom.bubble.offsetHeight || 80;
    const left = clamp(x, margin, window.innerWidth - bubbleWidth - margin);
    const top = clamp(y, margin, window.innerHeight - bubbleHeight - margin);
    dom.bubble.style.left = `${left}px`;
    dom.bubble.style.top = `${top}px`;
  }

  function setBubble(text: string): void {
    dom.bubble.textContent = text;
    const cursorX = parseFloat(dom.cursor.style.left || "0");
    const cursorY = parseFloat(dom.cursor.style.top || "0");
    positionBubble(cursorX + 20, cursorY - 16);
  }

  function positionCursor(
    x: number,
    y: number,
    mode: "idle" | "guide" | "snap" = "idle",
  ): void {
    const durations: Record<string, string> = {
      idle: "60ms",
      guide: "420ms",
      snap: "0ms",
    };
    dom.cursor.style.transitionDuration = durations[mode];
    dom.cursor.style.left = `${clamp(x, 0, window.innerWidth)}px`;
    dom.cursor.style.top = `${clamp(y, 0, window.innerHeight)}px`;
  }

  function positionHighlight(box: BoundingBox | null): void {
    if (!box) {
      dom.highlight.classList.remove("visible");
      return;
    }

    const left = box.topLeftX;
    const top = box.topLeftY;
    const width = Math.max(10, box.bottomRightX - box.topLeftX);
    const height = Math.max(10, box.bottomRightY - box.topLeftY);

    dom.highlight.style.left = `${left}px`;
    dom.highlight.style.top = `${top}px`;
    dom.highlight.style.width = `${width}px`;
    dom.highlight.style.height = `${height}px`;
    dom.highlight.classList.add("visible");
  }

  function updateRecordButton(): void {
    if (isProcessingRecording) {
      dom.recordButton.disabled = true;
      dom.recordButton.textContent = "Processing...";
      dom.recordButton.classList.remove("recording");
      return;
    }

    dom.recordButton.disabled = false;
    dom.recordButton.textContent = isRecording
      ? "Stop Recording"
      : "Start Recording";
    dom.recordButton.classList.toggle("recording", isRecording);
  }

  function handleError(error: unknown, context: string): void {
    const safeError = error instanceof Error ? error : new Error(context);
    setStatus(`${context} ${safeError.message}`);
    setBubble(`I hit an issue: ${safeError.message}`);
    cfg.onError?.(safeError);
  }

  // --- target resolution ---

  function resolveTargetBox(
    box: BoundingBox,
    searchText: string,
  ): BoundingBox {
    const viewportBox = scaleBox(box, lastSnapshotScale);
    if (!cfg.snapToDom) return viewportBox;
    return snapTargetToDom(viewportBox, searchText, {});
  }

  function pointCursorAtBox(box: BoundingBox): void {
    const center = centerOf(box);
    if (!center) return;
    dom.cursor.classList.add("guiding");
    positionCursor(center.x + 10, center.y + 8, "guide");
    positionBubble(center.x + 18, center.y - 20);
    positionHighlight(box);
  }

  // --- recording ---

  function releaseStream(): void {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      mediaStream = null;
    }
  }

  async function startRecording(): Promise<void> {
    if (isRecording || isProcessingRecording) return;

    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setStatus("This browser does not support microphone recording.");
      updateRecordButton();
      return;
    }

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickRecorderMimeType();
      mediaRecorder = mimeType
        ? new MediaRecorder(mediaStream, { mimeType })
        : new MediaRecorder(mediaStream);

      mediaChunks = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) mediaChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        void handleRecordingStop();
      };

      mediaRecorder.start();
      isRecording = true;
      dom.cursor.classList.add("recording");
      updateRecordButton();
      setStatus(
        "Listening... click Stop Recording or release Option/X to submit.",
      );
      setBubble("Listening. Ask your question now.");
    } catch (error) {
      updateRecordButton();
      handleError(error, "Could not start microphone recording.");
    }
  }

  function stopRecording(): void {
    if (!isRecording || !mediaRecorder) return;
    isRecording = false;
    dom.cursor.classList.remove("recording");
    updateRecordButton();

    if (mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
  }

  async function handleRecordingStop(): Promise<void> {
    isProcessingRecording = true;
    updateRecordButton();
    setStatus("Transcribing with Interfaze...");
    setBubble("Processing your question...");

    try {
      const mimeType = mediaRecorder?.mimeType || "audio/webm";
      const blob = new Blob(mediaChunks, { type: mimeType });
      mediaChunks = [];
      releaseStream();

      const dataUrl = await blobToDataUrl(blob);
      const transcript = await client.transcribeAudioDataUrl(
        dataUrl,
        `clippy-${Date.now()}.webm`,
      );

      const cleanTranscript = transcript.trim();
      if (!cleanTranscript) throw new Error("No speech detected.");

      cfg.onTranscript?.(cleanTranscript);
      goal = cleanTranscript;

      setStatus(`Question: ${cleanTranscript}`);
      await startGuideSession(cleanTranscript);
    } catch (error) {
      handleError(error, "Could not transcribe this recording.");
    } finally {
      isProcessingRecording = false;
      updateRecordButton();
      releaseStream();
    }
  }

  // --- guide session ---

  function focusTarget(rawBox: BoundingBox, instruction?: string): void {
    const box = resolveTargetBox(rawBox, goal);
    currentTargetRaw = rawBox;
    currentTargetBox = box;

    const center = centerOf(box);
    if (!center) {
      positionHighlight(null);
      setBubble("I cannot locate this target. Try scrolling to it.");
      return;
    }

    pointCursorAtBox(box);
    setBubble(instruction || `Step ${stepNumber + 1}: Click the highlighted element.`);
    setStatus(`Step ${stepNumber + 1}`);
  }

  async function getNextStepAndFocus(
    snapshot: ViewportSnapshot,
  ): Promise<boolean> {
    const result: NextStepResult = await client.getNextStep(
      snapshot.imageDataUrl,
      goal,
      completedSteps,
    );

    if (result.done || !result.target) return false;

    lastInstruction = result.instruction;
    focusTarget(result.target, result.instruction);
    return true;
  }

  async function advanceStep(bubbleText?: string): Promise<void> {
    if (advancing) return;
    advancing = true;
    stopObservationLoop();

    try {
      completedSteps.push(lastInstruction || `Completed step ${stepNumber + 1}`);
      stepNumber += 1;
      currentTargetRaw = null;
      currentTargetBox = null;
      missingTargetDetections = 0;
      lastInstruction = "";

      if (bubbleText) setBubble(bubbleText);
      setStatus("Detecting next step...");

      const snapshot = await captureViewport(
        cfg.screenshotScale,
        cfg.screenshotQuality,
      );
      lastSnapshotScale = snapshot.scale;

      const found = await getNextStepAndFocus(snapshot);

      if (!found) {
        finishGuide("Done. You completed the flow.");
        return;
      }

      stepStartedAt = Date.now();
      startObservationLoop();
    } catch (error) {
      handleError(error, "Could not detect next step.");
    } finally {
      advancing = false;
    }
  }

  function finishGuide(message: string): void {
    active = false;
    currentTargetRaw = null;
    currentTargetBox = null;
    dom.cursor.classList.remove("guiding");
    positionHighlight(null);
    stopObservationLoop();
    setStatus(message);
    setBubble(
      "Need another walkthrough? Type a question, click Record, or hold Option + X.",
    );
  }

  async function startGuideSession(userGoal: string): Promise<void> {
    active = true;
    currentTargetRaw = null;
    currentTargetBox = null;
    completedSteps = [];
    stepNumber = 0;
    missingTargetDetections = 0;
    stepStartedAt = Date.now();
    observeIteration = 0;
    advancing = false;
    lastInstruction = "";

    setStatus("Detecting where to go...");

    const snapshot = await captureViewport(
      cfg.screenshotScale,
      cfg.screenshotQuality,
    );
    lastSnapshotScale = snapshot.scale;

    const found = await getNextStepAndFocus(snapshot);
    if (!found) {
      setBubble("I could not find a target element. The goal may already be done, or try rephrasing.");
      setStatus("No target found.");
      active = false;
      return;
    }

    startObservationLoop();
  }

  // --- observation loop (gui_detection task only) ---

  function startObservationLoop(): void {
    stopObservationLoop();
    observeTimer = window.setInterval(() => {
      void observeProgress();
    }, cfg.observeIntervalMs);
  }

  function stopObservationLoop(): void {
    if (observeTimer !== null) {
      window.clearInterval(observeTimer);
      observeTimer = null;
    }
  }

  async function observeProgress(): Promise<void> {
    if (!active || observationRunning || advancing || !currentTargetRaw) return;

    observationRunning = true;
    try {
      observeIteration += 1;

      const snapshot = await captureViewport(
        cfg.screenshotScale,
        cfg.screenshotQuality,
      );
      lastSnapshotScale = snapshot.scale;

      const elements = await client.detectElements(snapshot.imageDataUrl);

      const match = findMatchingBox(elements, currentTargetRaw);

      if (match) {
        missingTargetDetections = 0;
        const refined = resolveTargetBox(match, goal);
        currentTargetRaw = match;
        currentTargetBox = refined;
        pointCursorAtBox(refined);
      } else {
        positionHighlight(null);
        missingTargetDetections += 1;

        if (
          lastInteractionAt > stepStartedAt &&
          missingTargetDetections >= 2
        ) {
          await advanceStep("Looks good. Moving forward.");
          return;
        }

        if (missingTargetDetections >= cfg.replanAfterMissingDetections) {
          missingTargetDetections = 0;
          stopObservationLoop();
          try {
            setStatus("Re-detecting from your current page...");
            const found = await getNextStepAndFocus(snapshot);
            if (!found) {
              finishGuide("Done. You completed the flow.");
              return;
            }
            startObservationLoop();
          } catch (error) {
            handleError(error, "Could not re-detect step.");
          }
          return;
        }

        setBubble("I cannot see this target right now. Try scrolling to it.");
      }
    } catch (error) {
      handleError(error, "The live guidance loop hit an error.");
      stopObservationLoop();
    } finally {
      observationRunning = false;
    }
  }

  // --- event handlers ---

  function handleMouseMove(event: MouseEvent): void {
    realPointer = { x: event.clientX, y: event.clientY };
    if (!active) {
      dom.cursor.classList.remove("guiding");
      positionCursor(realPointer.x + 18, realPointer.y + 14, "idle");
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (document.activeElement === dom.textInput) return;
    const isHotkey = event.altKey && event.key.toLowerCase() === "x";
    if (!isHotkey || event.repeat) return;
    void startRecording();
  }

  function handleKeyUp(event: KeyboardEvent): void {
    if (!isRecording) return;
    const isRelease = event.key.toLowerCase() === "x" || event.key === "Alt";
    if (isRelease) stopRecording();
  }

  function handleDocumentClick(event: MouseEvent): void {
    const clickTarget = event.target;
    if (clickTarget instanceof Node && dom.inputBar.contains(clickTarget)) {
      return;
    }

    lastInteractionAt = Date.now();

    if (!active || !currentTargetBox || advancing) return;

    if (
      isPointInsideBox(
        event.clientX,
        event.clientY,
        currentTargetBox,
        CLICK_TOLERANCE,
      )
    ) {
      void advanceStep("Nice. You completed that step.");
    }
  }

  function handleRecordButtonClick(): void {
    if (isRecording) {
      stopRecording();
      return;
    }
    void startRecording();
  }

  async function submitTextGoal(text: string): Promise<void> {
    const cleaned = text.trim();
    if (!cleaned || isProcessingRecording) return;

    cfg.onTranscript?.(cleaned);
    goal = cleaned;
    dom.textInput.value = "";

    setStatus(`Question: ${cleaned}`);
    setInputBarDisabled(true);

    try {
      await startGuideSession(cleaned);
    } catch (error) {
      handleError(error, "Could not start guide session.");
    } finally {
      setInputBarDisabled(false);
    }
  }

  function handleTextFormSubmit(event: Event): void {
    event.preventDefault();
    void submitTextGoal(dom.textInput.value);
  }

  function setInputBarDisabled(disabled: boolean): void {
    dom.textInput.disabled = disabled;
    dom.textSubmit.disabled = disabled;
    dom.recordButton.disabled = disabled;
    dom.textSubmit.textContent = disabled ? "..." : "Go";
  }

  // --- bind events ---

  window.addEventListener("mousemove", handleMouseMove, { passive: true });
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  document.addEventListener("click", handleDocumentClick, true);
  dom.recordButton.addEventListener("click", handleRecordButtonClick);
  dom.textForm.addEventListener("submit", handleTextFormSubmit);

  // --- initial state ---

  positionCursor(realPointer.x + 18, realPointer.y + 14, "snap");
  setStatus("Type a question, record, or hold Option + X.");
  setBubble("I will guide you step by step with a virtual cursor.");
  updateRecordButton();

  // --- public handle ---

  function destroy(): void {
    stopObservationLoop();
    stopRecording();
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("keydown", handleKeyDown);
    window.removeEventListener("keyup", handleKeyUp);
    document.removeEventListener("click", handleDocumentClick, true);
    dom.recordButton.removeEventListener("click", handleRecordButtonClick);
    dom.textForm.removeEventListener("submit", handleTextFormSubmit);
    dom.overlay.remove();
  }

  return { destroy };
}
