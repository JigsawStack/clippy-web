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
    this.executor = new Executor(this.cursor, config.apiKey, config.screenshots !== false);

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
      onTap: () => {
        if (this.isProcessing) {
          this.executor.cancel();
        }
        this.recorder.isTyping = true;
        this.cursor.showInput(
          (text) => {
            this.recorder.isTyping = false;
            this.handleTranscript(text);
          },
          () => {
            this.recorder.isTyping = false;
            this.cursor.setMode("idle");
          }
        );
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

const existing = (window as any).ClippyWeb || {};

const ClippyWeb: { apiKey: string; screenshots: boolean; _instance: Clippy | null; init: () => void } = {
  apiKey: existing.apiKey || "",
  screenshots: existing.screenshots !== false,
  _instance: null,

  init() {
    if (typeof document === "undefined") return;
    if (this._instance) return;

    if (!this.apiKey) {
      console.warn("[clippy] No API key provided. Set ClippyWeb.apiKey before loading clippy.js.");
      return;
    }

    this._instance = new Clippy({ apiKey: this.apiKey, screenshots: this.screenshots });
  },
};

(window as any).ClippyWeb = ClippyWeb;

function autoInit() {
  if (typeof document === "undefined") return;

  const boot = () => ClippyWeb.init();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
}

autoInit();
