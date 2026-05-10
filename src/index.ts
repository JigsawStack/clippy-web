import styles from "./clippy-web.css?inline";
import type { ClippyWebConfig, ClippyWebHandle } from "./types";
import { createWidget } from "./widget";

declare global {
  interface Window {
    ClippyWeb: typeof initializeClippyWeb;
  }
}

let handle: ClippyWebHandle | undefined;

function injectStyles(): void {
  if (document.querySelector("style[data-clippy-web]")) return;

  const style = document.createElement("style");
  style.setAttribute("data-clippy-web", "true");
  style.textContent = styles;
  document.head.appendChild(style);
}

function mount(apiKey: string, config: ClippyWebConfig): ClippyWebHandle {
  injectStyles();
  if (handle) return handle;

  handle = createWidget(apiKey, config);
  return handle;
}

function initializeClippyWeb(
  apiKey: string,
  config: ClippyWebConfig = {},
): ClippyWebHandle {
  if (typeof window === "undefined") {
    throw new Error("ClippyWeb can only run in a browser.");
  }

  if (document.readyState === "loading") {
    let deferred: ClippyWebHandle | undefined;

    const proxyHandle: ClippyWebHandle = {
      destroy() {
        deferred?.destroy();
      },
    };

    document.addEventListener(
      "DOMContentLoaded",
      () => {
        deferred = mount(apiKey, config);
      },
      { once: true },
    );

    return proxyHandle;
  }

  return mount(apiKey, config);
}

if (typeof window !== "undefined") {
  window.ClippyWeb = initializeClippyWeb;
}

export type { ClippyWebConfig, ClippyWebHandle } from "./types";
export { createWidget } from "./widget";
export default initializeClippyWeb;
