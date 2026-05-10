import { z } from "zod";

export const StepSchema = z.object({
  targetId: z.string(),
  instruction: z.string(),
  completesGoal: z.boolean(),
});

export const PlanSchema = z.object({ steps: z.array(StepSchema) });

export type Step = z.infer<typeof StepSchema>;
export type Plan = z.infer<typeof PlanSchema>;

export interface DomNode {
  id: string;
  role: string;
  name: string;
  rect: { x: number; y: number; w: number; h: number };
  visible: boolean;
}

export interface ClippyConfig {
  apiKey: string;
}

export const CLOSE_RADIUS = 150;
export const FAR_RADIUS = 400;
export const FAR_TIMEOUT = 1500;
export const MAX_NUDGES = 3;
export const DOM_QUIET_MS = 300;
export const DOM_QUIET_MAX_MS = 3000;
