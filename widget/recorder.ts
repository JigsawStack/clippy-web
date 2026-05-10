import { transcribeAudio } from "./api";

type RecorderCallback = (transcript: string) => void;

export class Recorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private isHolding = false;
  private isRecording = false;
  private onResult: RecorderCallback;
  private onStart: () => void;
  private onStop: () => void;
  private apiKey: string;

  constructor(opts: {
    onResult: RecorderCallback;
    onStart: () => void;
    onStop: () => void;
    apiKey: string;
  }) {
    this.onResult = opts.onResult;
    this.onStart = opts.onStart;
    this.onStop = opts.onStop;
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
    document.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.code === "KeyX" && !e.repeat && !this.isHolding && !this.isInputFocused()) {
        e.preventDefault();
        this.isHolding = true;
        this.startRecording();
      }
    });

    document.addEventListener("keyup", (e: KeyboardEvent) => {
      if (e.code === "KeyX" && this.isHolding) {
        e.preventDefault();
        this.isHolding = false;
        this.stopRecording();
      }
    });

    window.addEventListener("blur", () => {
      if (this.isHolding) {
        this.isHolding = false;
        this.stopRecording();
      }
    });
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
  }
}
