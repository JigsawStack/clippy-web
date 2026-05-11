import { transcribeAudio } from "./api";

type RecorderCallback = (transcript: string) => void;

const HOLD_THRESHOLD_MS = 250;

export class Recorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private isHolding = false;
  private isRecording = false;
  private holdTimer: ReturnType<typeof setTimeout> | null = null;
  private onResult: RecorderCallback;
  private onStart: () => void;
  private onStop: () => void;
  private onTap: () => void;
  private apiKey: string;
  private handleKeyDown!: (e: KeyboardEvent) => void;
  private handleKeyUp!: (e: KeyboardEvent) => void;
  private handleBlur!: () => void;
  isTyping = false;

  constructor(opts: {
    onResult: RecorderCallback;
    onStart: () => void;
    onStop: () => void;
    onTap: () => void;
    apiKey: string;
  }) {
    this.onResult = opts.onResult;
    this.onStart = opts.onStart;
    this.onStop = opts.onStop;
    this.onTap = opts.onTap;
    this.apiKey = opts.apiKey;
    this.setupKeyListeners();
  }

  private isInputFocused(): boolean {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    return (
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      (el as HTMLElement).isContentEditable
    );
  }

  private setupKeyListeners() {
    this.handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "KeyX" && !e.repeat && !this.isHolding && !this.isInputFocused() && !this.isTyping) {
        e.preventDefault();
        this.isHolding = true;
        this.holdTimer = setTimeout(() => {
          this.holdTimer = null;
          if (this.isHolding) {
            this.startRecording();
          }
        }, HOLD_THRESHOLD_MS);
      }
    };

    this.handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyX" && this.isHolding) {
        e.preventDefault();
        this.isHolding = false;

        if (this.holdTimer) {
          clearTimeout(this.holdTimer);
          this.holdTimer = null;
          this.onTap();
        } else {
          this.stopRecording();
        }
      }
    };

    this.handleBlur = () => {
      if (this.isHolding) {
        this.isHolding = false;
        if (this.holdTimer) {
          clearTimeout(this.holdTimer);
          this.holdTimer = null;
        }
        this.stopRecording();
      }
    };

    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.handleBlur);
  }

  private async startRecording() {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.warn("[clippy] Microphone access denied:", err);
      this.isHolding = false;
      return;
    }

    if (!this.isHolding) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    this.stream = stream;
    this.audioChunks = [];
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: this.getSupportedMimeType(),
    });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.audioChunks.push(e.data);
      }
    };

    this.mediaRecorder.start(100);
    this.isRecording = true;
    this.onStart();
  }

  private stopRecording() {
    if (!this.isRecording) return;
    this.isRecording = false;
    this.onStop();

    if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
      this.cleanup();
      return;
    }

    const recorder = this.mediaRecorder;
    recorder.onstop = async () => {
      const mimeType = recorder.mimeType || "audio/webm";
      const blob = new Blob(this.audioChunks, { type: mimeType });
      this.cleanup();

      if (blob.size < 1000) return;

      const base64 = await this.blobToBase64(blob);
      const ext = mimeType.includes("webm") ? "webm" : mimeType.includes("mp4") ? "mp4" : "ogg";

      try {
        const transcript = await transcribeAudio(this.apiKey, base64, `recording.${ext}`);
        const text = transcript.trim();
        if (text) {
          this.onResult(text);
        }
      } catch (err) {
        console.error("[clippy] Transcription failed:", err);
      }
    };

    recorder.stop();
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private getSupportedMimeType(): string {
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return "audio/webm";
  }

  private cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  destroy() {
    this.isHolding = false;
    this.isRecording = false;
    this.cleanup();
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("blur", this.handleBlur);
  }
}
