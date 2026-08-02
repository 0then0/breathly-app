import React, { FC } from "react";
import { Animated, StyleSheet } from "react-native";
import { colors } from "@breathly/design/colors";
import { useColorScheme } from "@breathly/design/theme";
import { fontFamilies, fontSizes } from "@breathly/design/typography";
import { getStepAccessibilityLabel } from "@breathly/screens/exercise-screen/accessibility-announcements";
import { interpolateTranslateY } from "@breathly/utils/interpolate";
import { useReduceMotion } from "@breathly/utils/use-accessibility-preferences";

interface Props {
  label: string;
  durationMs: number;
  animationValue: Animated.Value;
}

export const StepDescription: FC<Props> = ({ label, durationMs, animationValue }) => {
  const isDarkMode = useColorScheme() === "dark";
  const reduceMotionEnabled = useReduceMotion();
  const textAnimatedStyle = {
    opacity: animationValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
    // The label only fades when the user asked the system for less motion.
    transform: reduceMotionEnabled
      ? []
      : [
          interpolateTranslateY(animationValue, {
            inputRange: [0, 1],
            outputRange: [0, -8],
          }),
        ],
  };

  return (
    <Animated.Text
      style={[styles.label, isDarkMode && styles.labelDark, textAnimatedStyle]}
      testID="exercise.step"
      // Android reads the new step from the live region. iOS has no live
      // regions: the exercise screen announces the step there.
      accessibilityLiveRegion="polite"
      accessibilityLabel={getStepAccessibilityLabel(label, durationMs)}
    >
      {label}
    </Animated.Text>
  );
};

const styles = StyleSheet.create({
  label: {
    ...fontSizes.xxl2,
    color: colors["slate-800"],
    fontFamily: fontFamilies.medium,
    marginBottom: 16,
    textAlign: "center",
  },
  labelDark: {
    color: colors.white,
  },
});
