import { toPng } from "html-to-image";
import type { DomNode } from "./types";

const INTERACTIVE_SELECTOR = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[role="combobox"]',
  '[role="option"]',
  '[tabindex]:not([tabindex="-1"])',
  "label",
  "summary",
  "[onclick]",
  '[contenteditable="true"]',
].join(",");

let nextClippyId = 0;

function getAccessibleName(el: Element): string {
  const ariaLabel = el.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel;

  const labelledBy = el.getAttribute("aria-labelledby");
  if (labelledBy) {
    const label = document.getElementById(labelledBy);
    if (label) return label.textContent?.trim() || "";
  }

  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
    const id = el.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return label.textContent?.trim() || "";
    }
  }

  const title = el.getAttribute("title");
  if (title) return title;

  const text = el.textContent?.trim() || "";
  return text.length > 80 ? text.slice(0, 80) + "…" : text;
}

const ROLE_MAP: Record<string, string> = {
  a: "link",
  button: "button",
  input: "input",
  select: "combobox",
  textarea: "textbox",
  label: "label",
  summary: "button",
};

function getRole(el: Element): string {
  const explicit = el.getAttribute("role");
  if (explicit) return explicit;

  const tag = el.tagName.toLowerCase();

  if (tag === "input") {
    const type = (el as HTMLInputElement).type;
    if (type === "checkbox") return "checkbox";
    if (type === "radio") return "radio";
    if (type === "submit" || type === "button") return "button";
    return "textbox";
  }

  return ROLE_MAP[tag] || "generic";
}

function isInViewport(rect: DOMRect, vw: number, vh: number): boolean {
  return (
    rect.bottom > 0 &&
    rect.top < vh &&
    rect.right > 0 &&
    rect.left < vw
  );
}

export function buildDomTree(): { domTree: DomNode[]; cleanup: () => void } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  const elements = document.querySelectorAll(INTERACTIVE_SELECTOR);
  const nodes: DomNode[] = [];
  const stamped: { el: Element; attr: string | null }[] = [];

  elements.forEach((el) => {
    if (el.closest("#clippy-web-host")) return;

    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return;

    const clientRect = el.getBoundingClientRect();
    if (clientRect.width === 0 && clientRect.height === 0) return;

    const id = `clippy-${nextClippyId++}`;
    const prevAttr = el.getAttribute("data-clippy-id");
    el.setAttribute("data-clippy-id", id);
    stamped.push({ el, attr: prevAttr });

    nodes.push({
      id,
      role: getRole(el),
      name: getAccessibleName(el),
      rect: {
        x: Math.round(clientRect.left + scrollX),
        y: Math.round(clientRect.top + scrollY),
        w: Math.round(clientRect.width),
        h: Math.round(clientRect.height),
      },
      visible: isInViewport(clientRect, vw, vh),
    });
  });

  const cleanup = () => {
    stamped.forEach(({ el, attr }) => {
      if (attr === null) {
        el.removeAttribute("data-clippy-id");
      } else {
        el.setAttribute("data-clippy-id", attr);
      }
    });
  };

  return { domTree: nodes, cleanup };
}

export async function takeScreenshot(): Promise<{
  screenshot: string;
  screenshotKind: "viewport" | "fullpage";
}> {
  const docHeight = document.documentElement.scrollHeight;
  const vpHeight = window.innerHeight;
  const useFullPage = docHeight <= vpHeight * 2;

  const clippyHost = document.getElementById("clippy-web-host");
  const filterFn = (node: HTMLElement) => {
    if (node === clippyHost) return false;
    if (node.id === "clippy-web-host") return false;
    return true;
  };

  try {
    if (useFullPage) {
      const dataUrl = await toPng(document.documentElement, {
        width: document.documentElement.scrollWidth,
        height: docHeight,
        filter: filterFn,
        quality: 0.8,
        pixelRatio: 1,
      });
      return { screenshot: dataUrl, screenshotKind: "fullpage" };
    } else {
      const dataUrl = await toPng(document.documentElement, {
        width: window.innerWidth,
        height: vpHeight,
        filter: filterFn,
        quality: 0.8,
        pixelRatio: 1,
        style: {
          transform: `translate(-${window.scrollX}px, -${window.scrollY}px)`,
        },
      });
      return { screenshot: dataUrl, screenshotKind: "viewport" };
    }
  } catch (err) {
    console.warn("[clippy] Screenshot failed, sending empty:", err);
    return { screenshot: "", screenshotKind: "viewport" };
  }
}

export function getPageMeta() {
  return {
    url: window.location.href,
    viewport: {
      w: window.innerWidth,
      h: window.innerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
    },
    documentSize: {
      w: document.documentElement.scrollWidth,
      h: document.documentElement.scrollHeight,
    },
  };
}
