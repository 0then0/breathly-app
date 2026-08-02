import setColor from "color";
import React, { FC, useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { colors } from "@breathly/design/colors";
import { shortestDeviceDimension } from "@breathly/design/metrics";
import { useColorScheme } from "@breathly/design/theme";
import { animate } from "@breathly/utils/animate";
import { times } from "@breathly/utils/times";

const circleWidth = shortestDeviceDimension / 2;
const MOUNT_ANIMATION_DURATION = 300;

interface Props {
  animationValue: Animated.Value;
  color?: string;
}

export const BreathingAnimation: FC<Props> = ({ animationValue, color = colors.pastel.orange }) => {
  const colorScheme = useColorScheme();
  const mountAnimationValue = useRef(new Animated.Value(0)).current;
  const innerOpacity = animationValue.interpolate({
    inputRange: [0, 0.1, 1],
    outputRange: [0.1, 0, 0],
  });
  const innerScale = animationValue.interpolate({
    inputRange: [0, 0.1, 1],
    outputRange: [1.02, 0.9, 0.9],
  });
  useEffect(() => {
    const animation = animate(mountAnimationValue, {
      toValue: 1,
      duration: MOUNT_ANIMATION_DURATION,
    });
    animation.start();
    return () => animation.stop();
  }, [mountAnimationValue]);

  return (
    <Animated.View
      style={{
        minWidth: shortestDeviceDimension,
        minHeight: shortestDeviceDimension,
        opacity: mountAnimationValue,
      }}
    >
      <View style={styles.innerCircleLayer}>
        <Animated.View
          style={{
            position: "absolute",
            width: circleWidth,
            height: circleWidth,
            borderRadius: circleWidth / 2,
            backgroundColor: setColor(color).lighten(0.2).rgb().string(), // TODO:
            zIndex: 0,
            opacity: innerOpacity,
            transform: [
              {
                scale: innerScale,
              },
            ],
          }}
        />
      </View>
      <View
        style={{
          position: "absolute",
          left: shortestDeviceDimension / 4,
          top: shortestDeviceDimension / 4,
        }}
      >
        {
          // In dark mode we need to add a bit of brightness by rendering the animation with a
          // white color below the "real" animation.
          colorScheme === "dark" &&
            times(8).map((index) => (
              <RotatingCircle
                key={`dark-mode-circle-${index}`}
                color="white"
                opacity={0.3}
                animationValue={animationValue}
                index={index}
              />
            ))
        }
        {times(8).map((index) => (
          <RotatingCircle
            key={`circle-${index}`}
            color={color}
            opacity={0.2}
            animationValue={animationValue}
            index={index}
          />
        ))}
      </View>
    </Animated.View>
  );
};

interface RotatingCircleProps {
  animationValue: Animated.Value;
  opacity: number;
  index: number;
  color: string;
}

const RotatingCircle: FC<RotatingCircleProps> = ({ animationValue, opacity, index, color }) => {
  const rotation = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [`${index * 45}deg`, `${index * 45 + 180}deg`],
  });
  const translate = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, circleWidth / 6],
  });
  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 20,
        opacity,
        backgroundColor: color,
        width: circleWidth,
        height: circleWidth,
        borderRadius: circleWidth / 2,
        transform: [
          {
            rotateZ: rotation,
          },
          {
            translateX: translate,
          },
          {
            translateY: translate,
          },
        ],
      }}
    />
  );
};

const styles = StyleSheet.create({
  innerCircleLayer: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 30,
  },
});
