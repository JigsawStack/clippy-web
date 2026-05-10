import type { BoundingBox } from "./types";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function centerOf(
  box: BoundingBox | Partial<BoundingBox>,
): { x: number; y: number } | null {
  if (
    typeof box.topLeftX !== "number" ||
    typeof box.topLeftY !== "number" ||
    typeof box.bottomRightX !== "number" ||
    typeof box.bottomRightY !== "number"
  ) {
    return null;
  }

  return {
    x: (box.topLeftX + box.bottomRightX) / 2,
    y: (box.topLeftY + box.bottomRightY) / 2,
  };
}

export function distance(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function isPointInsideBox(
  x: number,
  y: number,
  box: BoundingBox,
  tolerance = 0,
): boolean {
  return (
    x >= box.topLeftX - tolerance &&
    x <= box.bottomRightX + tolerance &&
    y >= box.topLeftY - tolerance &&
    y <= box.bottomRightY + tolerance
  );
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () =>
      reject(new Error("Failed to convert audio blob to data URL"));
    reader.onloadend = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

export function pickRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") {
    return undefined;
  }

  const preferredTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return preferredTypes.find((type) => MediaRecorder.isTypeSupported(type));
}

export function scaleBox(box: BoundingBox, scale: number): BoundingBox {
  const s = Math.max(0.01, scale);
  return {
    topLeftX: box.topLeftX / s,
    topLeftY: box.topLeftY / s,
    bottomRightX: box.bottomRightX / s,
    bottomRightY: box.bottomRightY / s,
  };
}
