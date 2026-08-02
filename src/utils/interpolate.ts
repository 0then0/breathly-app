import { Animated, ScaleTransform, TranslateYTransform } from "react-native";

export const interpolateScale = (
  value: Animated.Value,
  config: Animated.InterpolationConfigType,
): Animated.WithAnimatedObject<ScaleTransform> => {
  const { inputRange, ...interpolationConfig } = config;
  return {
    scale: value.interpolate({
      ...interpolationConfig,
      inputRange,
    }),
  };
};

export const interpolateTranslateY = (
  value: Animated.Value,
  config: Animated.InterpolationConfigType,
): Animated.WithAnimatedObject<TranslateYTransform> => {
  const { inputRange, ...interpolationConfig } = config;
  return {
    translateY: value.interpolate({
      ...interpolationConfig,
      inputRange,
    }),
  };
};
