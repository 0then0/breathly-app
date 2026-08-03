import { useCallback, useEffect, useState } from "react";
import {
  setupGuidedBreathingAudio,
  releaseGuidedBreathingAudio,
  playEndingBellSound,
  playGuidedBreathingSound,
  stopGuidedBreathingAudio,
} from "@breathly/services/audio";
import { GuidedBreathingMode } from "@breathly/types/guided-breathing-mode";
import { StepMetadata } from "@breathly/types/step-metadata";

export const useExerciseAudio = (guidedBreathingVoice: GuidedBreathingMode) => {
  const [audioReady, setAudioReady] = useState(false);

  useEffect(() => {
    let active = true;

    // Every mode needs setup, including "disabled": the ending bell is not guidance, and the
    // service builds it on its own for the modes that have no step cues. Skipping setup here
    // left the bell player undefined, so a session with the voice off ended in silence.
    setAudioReady(false);
    setupGuidedBreathingAudio(guidedBreathingVoice)
      .then(() => {
        if (active) setAudioReady(true);
      })
      .catch(() => {
        if (active) setAudioReady(false);
      });

    return () => {
      active = false;
      void releaseGuidedBreathingAudio().catch(() => undefined);
    };
  }, [guidedBreathingVoice]);

  const playExerciseStepAudio = useCallback(
    (stepMetadata: StepMetadata) => {
      if (audioReady) void playGuidedBreathingSound(stepMetadata.audioId);
    },
    [audioReady],
  );

  const playExerciseCompletedAudio = useCallback(() => {
    if (audioReady) void playEndingBellSound();
  }, [audioReady]);

  return {
    audioReady,
    playExerciseStepAudio,
    playExerciseCompletedAudio,
    stopExerciseAudio: stopGuidedBreathingAudio,
  };
};
