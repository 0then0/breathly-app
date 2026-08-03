import React, { FC, useEffect, useMemo } from "react";
import { Animated, StyleSheet } from "react-native";
import { colors } from "@breathly/design/colors";
import { useColorScheme } from "@breathly/design/theme";
import { animate } from "@breathly/utils/animate";
import { interpolateScale } from "@breathly/utils/interpolate";
import { times } from "@breathly/utils/times";
import { useReduceMotion } from "@breathly/utils/use-accessibility-preferences";

const dotSize = Math.floor(4);
const fadeInAnimDuration = 400;

interface Props {
  visible?: boolean;
  numberOfDots: number;
  totalDuration: number;
}

export const AnimatedDots: FC<Props> = ({ visible = false, numberOfDots, totalDuration }) => {
  const isDarkMode = useColorScheme() === "dark";
  const reduceMotionEnabled = useReduceMotion();
  const dotAnimVals = useMemo(
    () => times(numberOfDots).map(() => new Animated.Value(0)),
    [numberOfDots],
  );

  const delayDuration = Math.max(
    0,
    Math.floor(totalDuration / Math.max(numberOfDots, 1) - fadeInAnimDuration),
  );

  useEffect(() => {
    const resetDots = () => dotAnimVals.forEach((value) => value.setValue(0));
    resetDots();
    if (!visible || dotAnimVals.length === 0) return;

    const sequence = Animated.sequence(
      dotAnimVals.flatMap((value) => [
        animate(value, {
          toValue: 1,
          duration: fadeInAnimDuration,
        }),
        Animated.delay(delayDuration),
      ]),
    );
    sequence.start(({ finished }) => {
      if (finished) resetDots();
    });
    return () => sequence.stop();
  }, [delayDuration, dotAnimVals, visible]);

  const dotsAnimatedStyles = dotAnimVals.map((val) => ({
    opacity: val.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
    // The dots only fade in when the user asked the system for less motion.
    transform: reduceMotionEnabled
      ? []
      : [
          interpolateScale(val, {
            inputRange: [0, 1],
            outputRange: [0, 1],
          }),
        ],
  }));

  return (
    <Animated.View style={styles.container}>
      {times(numberOfDots).map((index) => (
        <Animated.View
          key={`dot_${index}`}
          style={[styles.dot, isDarkMode && styles.dotDark, dotsAnimatedStyles[index]]}
        />
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  dot: {
    backgroundColor: colors["slate-800"],
    borderRadius: dotSize / 2,
    height: dotSize,
    margin: dotSize * 0.7,
    width: dotSize,
  },
  dotDark: {
    backgroundColor: colors.white,
  },
});
