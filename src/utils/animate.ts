import { Animated, Easing } from "react-native";

// The easing the app falls back to when a caller does not choose one.
export const defaultEasing = Easing.inOut(Easing.quad);

// Reduces the boilerplate for the most common animation config.
// `easing` sits above the spread so a caller can override it; it used to sit below, which
// silently discarded every easing passed in and left the whole app on one curve.
// `useNativeDriver` stays below on purpose: everything animated here is opacity or transform.
export const animate = (value: Animated.Value, config: Partial<Animated.TimingAnimationConfig>) => {
  return Animated.timing(value, {
    toValue: config.toValue!,
    ...config,
    // Below the spread, but coalesced rather than assigned: a caller that passes an easing
    // keeps it, and one that passes an explicit `undefined` still gets the app's curve
    // instead of React Native's own default.
    easing: config.easing ?? defaultEasing,
    useNativeDriver: true,
  });
};
