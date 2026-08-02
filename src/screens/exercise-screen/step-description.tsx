import React, { FC } from "react";
import { Animated, StyleSheet } from "react-native";
import { colors } from "@breathly/design/colors";
import { useColorScheme } from "@breathly/design/theme";
import { fontFamilies, fontSizes } from "@breathly/design/typography";
import { interpolateTranslateY } from "@breathly/utils/interpolate";

interface Props {
  label: string;
  animationValue: Animated.Value;
}

export const StepDescription: FC<Props> = ({ label, animationValue }) => {
  const isDarkMode = useColorScheme() === "dark";
  const textAnimatedStyle = {
    opacity: animationValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
    transform: [
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
