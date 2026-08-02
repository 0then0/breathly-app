import React, { FC, useEffect, useRef, useState } from "react";
import { Animated, AppState } from "react-native";
import {
  getActiveTickDeltaMs,
  getSessionNowMs,
} from "@breathly/screens/exercise-screen/exercise-session";
import { animate } from "@breathly/utils/animate";
import { formatTimer } from "@breathly/utils/format-timer";
import { useInterval } from "@breathly/utils/use-interval";

type Props = {
  limit: number;
  initialActiveElapsedMs: number;
  onActiveElapsedChange: (elapsedMs: number) => void;
  onLimitReached: () => void;
};

const timerRefreshIntervalMs = 250;
const maximumActiveTickGapMs = timerRefreshIntervalMs * 4;
const showAnimDuration = 500;
const hideAnimDuration = 400;

export const Timer: FC<Props> = ({
  limit,
  initialActiveElapsedMs,
  onActiveElapsedChange,
  onLimitReached,
}) => {
  const [elapsedTimeMs, setElapsedTimeMs] = useState(initialActiveElapsedMs);
  const elapsedTimeRef = useRef(initialActiveElapsedMs);
  const previousTickAtMs = useRef(getSessionNowMs());
  const opacityAnimVal = useRef(new Animated.Value(0)).current;
  const limitReachedRef = useRef(false);

  useInterval(() => {
    const currentTickAtMs = getSessionNowMs();
    const activeTickDeltaMs = getActiveTickDeltaMs(
      previousTickAtMs.current,
      currentTickAtMs,
      AppState.currentState === "active",
      maximumActiveTickGapMs
    );
    previousTickAtMs.current = currentTickAtMs;
    if (activeTickDeltaMs === 0) return;

    const nextElapsedTimeMs = limit
      ? Math.min(elapsedTimeRef.current + activeTickDeltaMs, limit)
      : elapsedTimeRef.current + activeTickDeltaMs;
    elapsedTimeRef.current = nextElapsedTimeMs;
    setElapsedTimeMs(nextElapsedTimeMs);
    onActiveElapsedChange(nextElapsedTimeMs);
  }, timerRefreshIntervalMs);

  const remainingTimeMs = limit ? Math.max(0, limit - elapsedTimeMs) : undefined;
  const limitReached = remainingTimeMs === 0;

  // The exercise continues until the end of the current exhale, thus the timer
  // stays at 00:00 for some seconds. It fades away instead: the clock is
  // complete, and only the last breath remains.
  useEffect(() => {
    const containerAnimation = animate(opacityAnimVal, {
      toValue: limitReached ? 0 : 1,
      duration: limitReached ? hideAnimDuration : showAnimDuration,
    });
    containerAnimation.start();
    return () => {
      containerAnimation.stop();
    };
  }, [limitReached, opacityAnimVal]);

  useEffect(() => {
    if (limitReached && !limitReachedRef.current) {
      limitReachedRef.current = true;
      onLimitReached();
    }
  }, [limitReached, onLimitReached]);

  const containerAnimatedStyle = {
    opacity: opacityAnimVal,
  };

  const timerText =
    remainingTimeMs == null
      ? formatTimer(Math.floor(elapsedTimeMs / 1000))
      : formatTimer(Math.ceil(remainingTimeMs / 1000));

  return (
    <Animated.View
      className="mt-4"
      style={containerAnimatedStyle}
      // The exercise continues after the timer fades away. Keep the invisible
      // 00:00 out of the accessibility tree while the last breath continues.
      accessibilityElementsHidden={limitReached}
      importantForAccessibility={limitReached ? "no-hide-descendants" : "auto"}
    >
      <Animated.Text
        className="text-center text-2xl text-slate-800 dark:text-white"
        style={{ fontVariant: ["tabular-nums"] }}
        testID="exercise.timer"
      >
        {timerText}
      </Animated.Text>
    </Animated.View>
  );
};
