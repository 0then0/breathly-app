import { Animated } from "react-native";
import { createStepAnimation, getTextAnimDurationMs } from "../step-animation";

// The native driver does nothing under Jest: the animated values never move and
// every animation reports that it finished. The defect that these tests cover is
// in the composition of the animations and not in the driver, thus the tests run
// the same animations on the JavaScript driver.
jest.mock("@breathly/utils/animate", () => {
  const { Animated: RNAnimated, Easing } = require("react-native");
  return {
    animate: (value: Animated.Value, config: Animated.TimingAnimationConfig) =>
      RNAnimated.timing(value, {
        ...config,
        useNativeDriver: false,
        easing: config.easing ?? Easing.inOut(Easing.quad),
      }),
  };
});

const frameMs = 1;

const readValue = (value: Animated.Value) =>
  (value as unknown as { __getValue: () => number }).__getValue();

const runStep = (durationMs: number) => {
  const exerciseAnimVal = new Animated.Value(0);
  const textAnimVal = new Animated.Value(0);
  let finished: boolean | undefined;
  let peakTextValue = 0;
  let lastExerciseChangeAtMs = 0;
  let lastExerciseValue = 0;

  createStepAnimation({ exerciseAnimVal, textAnimVal, toValue: 1, durationMs }).start((result) => {
    finished = result.finished;
  });

  for (let elapsedMs = frameMs; elapsedMs <= durationMs + frameMs; elapsedMs += frameMs) {
    jest.advanceTimersByTime(frameMs);
    const exerciseValue = readValue(exerciseAnimVal);
    if (exerciseValue !== lastExerciseValue) {
      lastExerciseValue = exerciseValue;
      lastExerciseChangeAtMs = elapsedMs;
    }
    peakTextValue = Math.max(peakTextValue, readValue(textAnimVal));
  }

  return {
    finished,
    exerciseValue: readValue(exerciseAnimVal),
    lastExerciseChangeAtMs,
    peakTextValue,
  };
};

describe("exercise step animation", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // A hold of half a second is available through the custom pattern settings.
  it("completes the breathing animation of a half-second step", () => {
    const run = runStep(500);

    expect(run.exerciseValue).toBe(1);
    expect(run.finished).toBe(true);
    expect(run.lastExerciseChangeAtMs).toBe(500);
  });

  it("shows the label of a half-second step at full opacity", () => {
    const run = runStep(500);

    expect(run.peakTextValue).toBeGreaterThan(0.99);
  });

  // The label animation lasted 400 ms at every step length, thus a step of
  // 800 ms or less started the fade out before the fade in ended.
  it("completes the breathing animation of an eight-hundred-millisecond step", () => {
    const run = runStep(800);

    expect(run.exerciseValue).toBe(1);
    expect(run.finished).toBe(true);
    expect(run.peakTextValue).toBeGreaterThan(0.99);
  });

  it("keeps the label animation of a normal step unchanged", () => {
    expect(getTextAnimDurationMs(4000)).toBe(400);

    const run = runStep(4000);

    expect(run.exerciseValue).toBe(1);
    expect(run.finished).toBe(true);
    expect(run.peakTextValue).toBeGreaterThan(0.99);
  });

  it("keeps the two label fades apart at every available step length", () => {
    const stepDurationsMs = [500, 800, 1_000, 2_000, 4_000, 99_000];

    stepDurationsMs.forEach((stepDurationMs) => {
      expect(getTextAnimDurationMs(stepDurationMs) * 2).toBeLessThanOrEqual(stepDurationMs);
    });
  });
});
