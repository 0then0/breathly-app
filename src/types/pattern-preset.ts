// Inhale, hold, exhale, hold. Every pattern in the app has exactly these four steps, and a
// zero-length step is skipped.
export type PatternSteps = [number, number, number, number];

export interface PatternPreset {
  id: string;
  name: string;
  steps: PatternSteps;
  description: string;
}
