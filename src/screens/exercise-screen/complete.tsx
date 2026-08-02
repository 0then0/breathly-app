import React, { FC, useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { colors } from "@breathly/design/colors";
import { useColorScheme } from "@breathly/design/theme";
import { fontFamilies, fontSizes } from "@breathly/design/typography";
import {
  announceForScreenReader,
  sessionCompleteAnnouncement,
} from "@breathly/screens/exercise-screen/accessibility-announcements";
import { animate } from "@breathly/utils/animate";
import { interpolateTranslateY } from "@breathly/utils/interpolate";

const mountAnimDuration = 400;

export const ExerciseComplete: FC = () => {
  const isDarkMode = useColorScheme() === "dark";
  const mountAnimVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const mountAnimation = animate(mountAnimVal, {
      toValue: 1,
      duration: mountAnimDuration,
    });
    mountAnimation.start();
    return () => mountAnimation.stop();
  }, [mountAnimVal]);

  // The screen does not change: a screen reader reads nothing on its own when
  // the exercise ends.
  useEffect(() => {
    announceForScreenReader(sessionCompleteAnnouncement);
  }, []);

  const containerAnimatedStyle = {
    opacity: mountAnimVal.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
    transform: [
      interpolateTranslateY(mountAnimVal, {
        inputRange: [0, 1],
        outputRange: [0, 8],
      }),
    ],
  };

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]} testID="exercise.complete">
      <Text style={[styles.title, isDarkMode && styles.titleDark]}>Complete</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  title: {
    ...fontSizes.xxl5,
    color: colors["slate-800"],
    fontFamily: fontFamilies.serifMedium,
    includeFontPadding: true,
    lineHeight: 80,
    paddingBottom: 8,
    textAlign: "center",
    textAlignVertical: "center",
  },
  titleDark: {
    color: colors.white,
  },
});
