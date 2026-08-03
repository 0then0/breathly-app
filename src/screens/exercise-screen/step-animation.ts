import { Animated } from "react-native";
import { animate } from "@breathly/utils/animate";

const maximumTextAnimDurationMs = 400;
// The label fades in at the start of the step and out at its end, and both fades
// use the same animated value. A fade out that starts before the fade in ends
// stops the fade in, thus the label never becomes readable. The two fades
// together must therefore stay inside the step.
const maximumTextAnimStepRatio = 0.35;

export const getTextAnimDurationMs = (stepDurationMs: number) =>
  Math.max(0, Math.min(maximumTextAnimDurationMs, stepDurationMs * maximumTextAnimStepRatio));

interface StepAnimationOptions {
  exerciseAnimVal: Animated.Value;
  textAnimVal: Animated.Value;
  toValue: number;
  durationMs: number;
}

export const createStepAnimation = ({
  exerciseAnimVal,
  textAnimVal,
  toValue,
  durationMs,
}: StepAnimationOptions): Animated.CompositeAnimation => {
  const textAnimDurationMs = getTextAnimDurationMs(durationMs);
  return Animated.stagger(Math.max(0, durationMs - textAnimDurationMs), [
    Animated.parallel(
      [
        animate(exerciseAnimVal, {
          toValue: toValue,
          duration: durationMs,
        }),
        animate(textAnimVal, {
          toValue: 1,
          duration: textAnimDurationMs,
        }),
      ],
      // The breathing circle carries the rhythm of the exercise: it must
      // continue even if the label animation stops.
      { stopTogether: false },
    ),
    animate(textAnimVal, {
      toValue: 0,
      duration: textAnimDurationMs,
    }),
  ]);
};
