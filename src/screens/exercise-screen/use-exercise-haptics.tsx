import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Platform, Vibration } from "react-native";

// Returns the cue that the exercise plays at the start of each breathing step.
// The caller decides when to play it: the step that follows the completion of
// the exercise must not cue the user to breathe again.
export const useExerciseHaptics = (vibrationEnabled: boolean) =>
  useCallback(() => {
    if (!vibrationEnabled) return;
    if (Platform.OS === "ios") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else if (Platform.OS === "android") {
      // `expo-haptics` doesn't provide a vibration pattern "soft" enough for my tastes on
      // Android so I fallback to the Vibration API.
      Vibration.vibrate(100);
    }
  }, [vibrationEnabled]);
