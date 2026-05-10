import { ClippyCursor } from "./cursor";
import { Recorder } from "./recorder";
import { Executor } from "./executor";
import type { ClippyConfig } from "./types";

export class Clippy {
  private cursor: ClippyCursor;
  private recorder: Recorder;
  private executor: Executor;
  private isProcessing = false;

  constructor(config: ClippyConfig) {
    this.cursor = new ClippyCursor();
    this.executor = new Executor(this.cursor, config.apiKey);

    this.recorder = new Recorder({
      onResult: (transcript) => this.handleTranscript(transcript),
      onStart: () => {
        if (this.isProcessing) {
          this.executor.cancel();
        }
        this.cursor.setMode("recording");
      },
      onStop: () => {
        if (this.cursor.mode === "recording") {
          this.cursor.showLoading();
        }
      },
      apiKey: config.apiKey,
    });
  }

  private async handleTranscript(transcript: string) {
    if (!transcript) return;
    this.isProcessing = true;
    this.cursor.showLoading(transcript);
    try {
      await this.executor.start(transcript);
    } catch (err) {
      console.error("[clippy] Error executing plan:", err);
      this.cursor.setMode("idle");
    }
    this.isProcessing = false;
  }

  destroy() {
    this.recorder.destroy();
    this.executor.cancel();
    this.cursor.destroy();
  }
}

function autoInit() {
  if (typeof document === "undefined") return;

  const init = () => {
    const script =
      document.querySelector<HTMLScriptElement>("script[data-clippy-api-key]") ||
      document.currentScript as HTMLScriptElement | null;

    const apiKey = script?.getAttribute("data-clippy-api-key") || "";

    if (!apiKey) {
      console.warn("[clippy] No API key provided. Add data-clippy-api-key to the script tag.");
      return;
    }

    (window as any).__clippy = new Clippy({ apiKey });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}

autoInit();
