import { STYLES, CURSOR_SVG } from "./styles";

export type CursorMode = "idle" | "guiding" | "loading" | "recording" | "typing" | "done";

export class ClippyCursor {
  private shadow: ShadowRoot;
  private cursorEl: HTMLDivElement;
  private bubbleEl: HTMLDivElement;
  private pulseEl: HTMLDivElement;
  private micEl: HTMLDivElement;
  private loadingEl: HTMLDivElement;
  private inputWrapEl: HTMLDivElement;
  private inputEl: HTMLInputElement;

  private curX = 0;
  private curY = 0;
  private targetX = 0;
  private targetY = 0;
  private userMouseX = 0;
  private userMouseY = 0;
  private rafId = 0;
  private _mode: CursorMode = "idle";
  private spring = 0.12;

  constructor() {
    const host = document.createElement("div");
    host.id = "clippy-web-host";
    this.shadow = host.attachShadow({ mode: "closed" });

    const style = document.createElement("style");
    style.textContent = STYLES;
    this.shadow.appendChild(style);

    this.cursorEl = document.createElement("div");
    this.cursorEl.className = "clippy-cursor";
    this.cursorEl.innerHTML = CURSOR_SVG;
    this.shadow.appendChild(this.cursorEl);

    this.bubbleEl = document.createElement("div");
    this.bubbleEl.className = "clippy-bubble";
    this.shadow.appendChild(this.bubbleEl);

    this.pulseEl = document.createElement("div");
    this.pulseEl.className = "clippy-pulse";
    this.pulseEl.style.display = "none";
    this.shadow.appendChild(this.pulseEl);

    this.micEl = document.createElement("div");
    this.micEl.className = "clippy-mic";
    this.micEl.innerHTML = '<span class="mic-dot"></span>Listening…';
    this.micEl.style.display = "none";
    this.shadow.appendChild(this.micEl);

    this.loadingEl = document.createElement("div");
    this.loadingEl.className = "clippy-loading";
    this.loadingEl.innerHTML =
      '<span class="clippy-loading-dot"></span><span class="clippy-loading-dot"></span><span class="clippy-loading-dot"></span>';
    this.loadingEl.style.display = "none";
    this.shadow.appendChild(this.loadingEl);

    this.inputWrapEl = document.createElement("div");
    this.inputWrapEl.className = "clippy-input-wrap";
    this.inputEl = document.createElement("input");
    this.inputEl.type = "text";
    this.inputEl.placeholder = "Type your question and press Enter…";
    this.inputWrapEl.appendChild(this.inputEl);
    this.shadow.appendChild(this.inputWrapEl);

    document.body.appendChild(host);

    document.addEventListener("mousemove", (e) => {
      this.userMouseX = e.clientX;
      this.userMouseY = e.clientY;
    });

    this.curX = window.innerWidth / 2;
    this.curY = window.innerHeight / 2;
    this.targetX = this.curX;
    this.targetY = this.curY;

    this.tick();
  }

  get mode() {
    return this._mode;
  }

  get mouseX() {
    return this.userMouseX;
  }

  get mouseY() {
    return this.userMouseY;
  }

  setMode(mode: CursorMode) {
    this._mode = mode;
    this.micEl.style.display = mode === "recording" ? "block" : "none";
    this.loadingEl.style.display = "none";
    if (mode !== "typing") {
      this.hideInput();
    }
    if (mode === "recording" || mode === "idle") {
      this.hideBubble();
      this.hidePulse();
    }
  }

  showLoading(transcript?: string) {
    this._mode = "loading";
    this.micEl.style.display = "none";
    this.loadingEl.style.display = "none";
    this.hidePulse();

    const dots = '<span class="clippy-inline-dots"><span class="clippy-loading-dot"></span><span class="clippy-loading-dot"></span><span class="clippy-loading-dot"></span></span>';
    const text = transcript
      ? `"${this.escapeHtml(transcript)}" ${dots}`
      : `Thinking ${dots}`;
    this.bubbleEl.innerHTML = text;
    this.bubbleEl.classList.add("visible");
  }

  moveTo(x: number, y: number) {
    this.targetX = x;
    this.targetY = y;
  }

  showBubble(text: string) {
    this.bubbleEl.innerHTML = this.escapeHtml(text);
    this.bubbleEl.classList.add("visible");
  }

  hideBubble() {
    this.bubbleEl.classList.remove("visible");
  }

  showPulse(rect: DOMRect) {
    const pad = 4;
    this.pulseEl.style.display = "block";
    this.pulseEl.style.left = `${rect.left - pad}px`;
    this.pulseEl.style.top = `${rect.top - pad}px`;
    this.pulseEl.style.width = `${rect.width + pad * 2}px`;
    this.pulseEl.style.height = `${rect.height + pad * 2}px`;
  }

  hidePulse() {
    this.pulseEl.style.display = "none";
  }

  showDone() {
    this.showBubble("Done — anything else? (press X to type, hold to speak)");
    this._mode = "done";
    setTimeout(() => {
      if (this._mode === "done") {
        this.hideBubble();
        this.setMode("idle");
      }
    }, 5000);
  }

  showInput(onSubmit: (text: string) => void, onCancel: () => void) {
    this._mode = "typing";
    this.micEl.style.display = "none";
    this.loadingEl.style.display = "none";
    this.hideBubble();
    this.hidePulse();

    this.inputEl.value = "";
    this.inputWrapEl.classList.add("visible");

    requestAnimationFrame(() => this.inputEl.focus());

    const cleanup = () => {
      this.inputEl.removeEventListener("keydown", onKey);
      this.inputEl.removeEventListener("blur", onBlur);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const text = this.inputEl.value.trim();
        cleanup();
        this.hideInput();
        if (text) {
          onSubmit(text);
        } else {
          onCancel();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        cleanup();
        this.hideInput();
        onCancel();
      }
    };

    const onBlur = () => {
      setTimeout(() => {
        if (this._mode === "typing") {
          cleanup();
          this.hideInput();
          onCancel();
        }
      }, 150);
    };

    this.inputEl.addEventListener("keydown", onKey);
    this.inputEl.addEventListener("blur", onBlur);
  }

  hideInput() {
    this.inputWrapEl.classList.remove("visible");
    this.inputEl.blur();
  }

  private tick = () => {
    if (this._mode === "idle" || this._mode === "done" || this._mode === "recording" || this._mode === "loading" || this._mode === "typing") {
      this.targetX = this.userMouseX + 20;
      this.targetY = this.userMouseY + 20;
    }

    this.curX += (this.targetX - this.curX) * this.spring;
    this.curY += (this.targetY - this.curY) * this.spring;

    this.cursorEl.style.transform = `translate(${this.curX}px, ${this.curY}px)`;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const flipX = this.curX + 24 + this.bubbleEl.offsetWidth > vw - 10;

    let bubbleX = flipX ? this.curX - this.bubbleEl.offsetWidth - 8 : this.curX + 24;
    let bubbleY = this.curY - 8;
    if (bubbleY + this.bubbleEl.offsetHeight > vh - 10) {
      bubbleY = vh - this.bubbleEl.offsetHeight - 10;
    }
    if (bubbleY < 10) bubbleY = 10;
    this.bubbleEl.style.left = `${bubbleX}px`;
    this.bubbleEl.style.top = `${bubbleY}px`;

    const sideX = flipX ? this.curX - 8 : this.curX + 24;
    this.loadingEl.style.left = `${flipX ? this.curX - this.loadingEl.offsetWidth - 8 : this.curX + 24}px`;
    this.loadingEl.style.top = `${this.curY + 4}px`;

    this.micEl.style.left = `${flipX ? this.curX - this.micEl.offsetWidth - 8 : this.curX + 24}px`;
    this.micEl.style.top = `${this.curY - 4}px`;

    this.inputWrapEl.style.left = `${flipX ? this.curX - this.inputWrapEl.offsetWidth - 8 : this.curX + 24}px`;
    this.inputWrapEl.style.top = `${this.curY - 8}px`;

    this.rafId = requestAnimationFrame(this.tick);
  };

  destroy() {
    cancelAnimationFrame(this.rafId);
    this.shadow.host.remove();
  }

  private escapeHtml(s: string) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }
}
