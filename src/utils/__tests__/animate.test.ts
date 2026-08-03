import { Animated, Easing } from "react-native";
import { animate, defaultEasing } from "../animate";

const timingConfigOf = (spy: jest.SpyInstance) =>
  spy.mock.calls[0]?.[1] as Animated.TimingAnimationConfig | undefined;

describe("animate", () => {
  let timingSpy: jest.SpyInstance;

  beforeEach(() => {
    timingSpy = jest.spyOn(Animated, "timing");
  });

  afterEach(() => {
    timingSpy.mockRestore();
  });

  it("uses the easing the caller passes", () => {
    // The easing used to be applied after the config spread, which discarded whatever the
    // caller asked for and left every animation in the app on the same curve.
    animate(new Animated.Value(0), { toValue: 1, duration: 100, easing: Easing.linear });

    expect(timingConfigOf(timingSpy)?.easing).toBe(Easing.linear);
  });

  it("falls back to the shared easing when the caller passes none", () => {
    animate(new Animated.Value(0), { toValue: 1, duration: 100 });

    expect(timingConfigOf(timingSpy)?.easing).toBe(defaultEasing);
  });

  it("keeps every animation on the native driver", () => {
    animate(new Animated.Value(0), { toValue: 1, duration: 100, useNativeDriver: false });

    expect(timingConfigOf(timingSpy)?.useNativeDriver).toBe(true);
  });
});
