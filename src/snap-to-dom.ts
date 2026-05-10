import type { BoundingBox, DebugFn } from "./types";
import { centerOf, distance } from "./utils";

const DEFAULT_SELECTOR = [
  "input",
  "textarea",
  "select",
  "button",
  "a[href]",
  "label",
  "[role='button']",
  "[role='checkbox']",
  "[role='switch']",
  "[role='tab']",
  "[role='menuitem']",
  "[contenteditable='true']",
].join(",");

export interface SnapToDomOptions {
  debug?: DebugFn;
  selector?: string;
}

function tokenHits(text: string, tokens: string[]): number {
  if (!text || tokens.length === 0) return 0;
  const lower = text.toLowerCase();
  return tokens.reduce(
    (hits, token) => (lower.includes(token) ? hits + 1 : hits),
    0,
  );
}

function toTokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3)
    .slice(0, 14);
}

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

function getElementTextFingerprint(element: HTMLElement): string {
  const value =
    "value" in element && typeof element.value === "string"
      ? element.value
      : "";
  return [
    element.getAttribute("aria-label"),
    element.getAttribute("name"),
    element.getAttribute("id"),
    element.getAttribute("placeholder"),
    element.getAttribute("data-testid"),
    value,
    element.innerText,
    element.textContent,
  ]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ")
    .toLowerCase();
}

function toBoundingBoxFromRect(rect: DOMRect): BoundingBox {
  return {
    topLeftX: rect.left,
    topLeftY: rect.top,
    bottomRightX: rect.right,
    bottomRightY: rect.bottom,
  };
}

/**
 * Snap a model-predicted bounding box to the nearest real DOM element.
 * Returns the DOM element's box if a good match is found, otherwise the original.
 */
export function snapTargetToDom(
  modelBox: BoundingBox,
  searchText: string,
  options: SnapToDomOptions = {},
): BoundingBox {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return modelBox;
  }

  const modelCenter = centerOf(modelBox);
  if (!modelCenter) return modelBox;

  const selector = options.selector ?? DEFAULT_SELECTOR;
  const tokens = toTokens(searchText);

  let best:
    | {
        score: number;
        distance: number;
        iou: number;
        tokenMatchCount: number;
        rect: DOMRect;
        textFingerprint: string;
        tagName: string;
      }
    | undefined;

  const nodes = document.querySelectorAll<HTMLElement>(selector);
  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    if (rect.width < 8 || rect.height < 8) continue;
    if (
      rect.bottom < 0 ||
      rect.right < 0 ||
      rect.top > window.innerHeight ||
      rect.left > window.innerWidth
    ) {
      continue;
    }

    const box = toBoundingBoxFromRect(rect);
    const iou = intersectionOverUnion(modelBox, box);
    const domCenter = centerOf(box);
    if (!domCenter) continue;

    const dist = distance(modelCenter, domCenter);
    const textFingerprint = getElementTextFingerprint(node);
    const tokenMatchCount = tokenHits(textFingerprint, tokens);

    const likelyInteractive = /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(
      node.tagName,
    )
      ? 1
      : 0;
    const score =
      iou * 22 +
      Math.max(0, 6 - dist / 35) +
      tokenMatchCount * 2.4 +
      likelyInteractive;

    if (!best || score > best.score) {
      best = {
        score,
        distance: dist,
        iou,
        tokenMatchCount,
        rect,
        textFingerprint,
        tagName: node.tagName,
      };
    }
  }

  if (!best) {
    options.debug?.("guide.target_dom_refine_no_candidate", { modelBox });
    return modelBox;
  }

  const shouldSnap =
    best.iou >= 0.08 || best.distance <= 90 || best.tokenMatchCount >= 2;

  options.debug?.("guide.target_dom_refine", {
    modelBox,
    bestCandidate: {
      score: best.score,
      distance: best.distance,
      iou: best.iou,
      tokenMatchCount: best.tokenMatchCount,
      tagName: best.tagName,
      textFingerprint: best.textFingerprint.slice(0, 180),
      rect: {
        left: best.rect.left,
        top: best.rect.top,
        right: best.rect.right,
        bottom: best.rect.bottom,
        width: best.rect.width,
        height: best.rect.height,
      },
    },
    shouldSnap,
  });

  if (!shouldSnap) return modelBox;

  return toBoundingBoxFromRect(best.rect);
}
