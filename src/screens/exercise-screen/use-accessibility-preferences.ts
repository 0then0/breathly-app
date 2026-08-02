import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

// The exercise rotates and translates eight circles (sixteen in dark mode)
// across the width of the screen for the whole session. That is the motion
// profile that starts vestibular symptoms, thus the system setting must remove
// it. The voice and the haptic carry the rhythm on their own, thus the exercise
// loses nothing.
export const useReduceMotion = () => {
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) setReduceMotionEnabled(enabled);
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotionEnabled,
    );

    return () => {
      active = false;
      // On the web the subscription is missing when the browser has no
      // `matchMedia`.
      subscription?.remove();
    };
  }, []);

  return reduceMotionEnabled;
};
