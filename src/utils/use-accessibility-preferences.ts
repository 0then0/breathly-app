import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform } from "react-native";

// The system gives its answer asynchronously, thus the first render of a
// component knows nothing. The last answer stays here: the components of the
// exercise mount at different times, and a component that mounts later must not
// draw one frame of the motion that the user does not want.
let lastKnownReduceMotionEnabled = false;
let lastKnownScreenReaderEnabled = false;

// The exercise rotates and translates eight circles (sixteen in dark mode)
// across the width of the screen for the whole session. That is the motion
// profile that starts vestibular symptoms, thus the system setting must remove
// it. The voice and the haptic carry the rhythm on their own, thus the exercise
// loses nothing.
export const useReduceMotion = () => {
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(lastKnownReduceMotionEnabled);

  useEffect(() => {
    let active = true;
    const applyAnswer = (enabled: boolean) => {
      lastKnownReduceMotionEnabled = enabled;
      if (active) setReduceMotionEnabled(enabled);
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then(applyAnswer)
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", applyAnswer);

    return () => {
      active = false;
      // On the web the subscription is missing when the browser has no
      // `matchMedia`.
      subscription?.remove();
    };
  }, []);

  return reduceMotionEnabled;
};

export const useScreenReaderEnabled = () => {
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(lastKnownScreenReaderEnabled);

  useEffect(() => {
    // `react-native-web` answers "true" to this question in every browser, thus
    // the app asks it only on the two mobile platforms.
    if (Platform.OS === "web") return;

    let active = true;
    const applyAnswer = (enabled: boolean) => {
      lastKnownScreenReaderEnabled = enabled;
      if (active) setScreenReaderEnabled(enabled);
    };

    AccessibilityInfo.isScreenReaderEnabled()
      .then(applyAnswer)
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener("screenReaderChanged", applyAnswer);

    return () => {
      active = false;
      subscription?.remove();
    };
  }, []);

  return screenReaderEnabled;
};
