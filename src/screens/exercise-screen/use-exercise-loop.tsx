import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated } from "react-native";
import { createStepAnimation } from "@breathly/screens/exercise-screen/step-animation";
import { StepMetadata } from "@breathly/types/step-metadata";
import { loopAnimations } from "@breathly/utils/loop-animations";

export const useExerciseLoop = (
  stepsMetadata: [StepMetadata, StepMetadata, StepMetadata, StepMetadata],
  initialStepIndex: number,
  onStepStart: (stepIndex: number) => void,
) => {
  const activeSteps = useMemo(() => stepsMetadata.filter((step) => !step.skipped), [stepsMetadata]);
  // Capture the step index once at mount: the session store echoes every step change
  // back into this prop, and reading it live would tear down and restart the loop
  // effect on each step.
  const initialStepIndexRef = useRef(
    Math.min(Math.max(initialStepIndex, 0), Math.max(activeSteps.length - 1, 0)),
  );
  const initialStep = activeSteps[initialStepIndexRef.current];
  const initialExerciseAnimationValue =
    initialStep?.id === "afterInhale" || initialStep?.id === "exhale" ? 1 : 0;
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStepIndexRef.current);
  const textAnimVal = useRef(new Animated.Value(0)).current;
  const exerciseAnimVal = useRef(new Animated.Value(initialExerciseAnimationValue)).current;
  const currentStep: StepMetadata | undefined = activeSteps[currentStepIndex];

  const animateStep = useCallback(
    (toValue: number, durationMs: number) =>
      createStepAnimation({ exerciseAnimVal, textAnimVal, toValue, durationMs }),
    [exerciseAnimVal, textAnimVal],
  );

  useEffect(() => {
    const createStepAnimations = () =>
      activeSteps.map((x) =>
        animateStep(x.id === "inhale" || x.id === "afterInhale" ? 1 : 0, x.duration),
      );
    const cleanupExerciseLoop = loopAnimations(
      createStepAnimations,
      (stepIndex: number) => {
        setCurrentStepIndex(stepIndex);
        onStepStart(stepIndex);
      },
      initialStepIndexRef.current,
    );
    return () => {
      cleanupExerciseLoop();
    };
  }, [activeSteps, animateStep, onStepStart]);

  return { currentStep, exerciseAnimVal, textAnimVal };
};
