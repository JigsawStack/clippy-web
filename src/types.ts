export interface BoundingBox {
  topLeftX: number;
  topLeftY: number;
  bottomRightX: number;
  bottomRightY: number;
}

export interface DetectedElement {
  type: string;
  topLeftX: number;
  topLeftY: number;
  bottomRightX: number;
  bottomRightY: number;
}

export interface ClippyWebConfig {
  baseUrl?: string;
  model?: string;
  observeIntervalMs?: number;
  screenshotScale?: number;
  screenshotQuality?: number;
  bubbleMaxWidth?: number;
  replanAfterMissingDetections?: number;
  snapToDom?: boolean;
  debug?: boolean;
  onTranscript?: (transcript: string) => void;
  onError?: (error: Error) => void;
}

export interface InterfazeClientOptions {
  baseUrl?: string;
  model?: string;
  debug?: boolean;
}

export interface NextStepResult {
  done: boolean;
  instruction: string;
  target: BoundingBox | null;
}

export interface InterfazeClient {
  transcribeAudioDataUrl: (
    dataUrl: string,
    filename?: string,
  ) => Promise<string>;
  getNextStep: (
    imageDataUrl: string,
    goal: string,
    completedSteps?: string[],
  ) => Promise<NextStepResult>;
  detectElements: (imageDataUrl: string) => Promise<DetectedElement[]>;
}

export interface ClippyWebHandle {
  destroy: () => void;
}

export type DebugFn = (event: string, payload: unknown) => void;

export interface ViewportSnapshot {
  imageDataUrl: string;
  scale: number;
  viewportWidth: number;
  viewportHeight: number;
  scrollX: number;
  scrollY: number;
}
