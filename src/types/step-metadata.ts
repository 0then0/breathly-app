import type { GuidedBreathingStep } from "@breathly/types/guided-breathing-step";

export type StepId = "inhale" | "afterInhale" | "exhale" | "afterExhale";

export interface StepMetadata {
  id: StepId;
  audioId: GuidedBreathingStep;
  label: string;
  duration: number;
  showDots: boolean;
  skipped: boolean;
}
