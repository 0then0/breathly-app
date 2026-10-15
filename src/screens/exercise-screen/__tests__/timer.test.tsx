import { act, render } from "@testing-library/react-native";
import React from "react";
import { Timer } from "../timer";

describe("Timer", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("arms exercise completion in the tick that reaches the limit", async () => {
    const onLimitReached = jest.fn();
    const onActiveElapsedChange = jest.fn(() => {
      expect(onLimitReached).toHaveBeenCalledTimes(1);
    });

    await render(
      <Timer
        limit={250}
        initialActiveElapsedMs={0}
        onActiveElapsedChange={onActiveElapsedChange}
        onLimitReached={onLimitReached}
      />,
    );

    await act(async () => {
      jest.advanceTimersByTime(750);
    });

    expect(onLimitReached).toHaveBeenCalledTimes(1);
    expect(onActiveElapsedChange).toHaveBeenLastCalledWith(250);
  });

  it("arms completion when it mounts after the limit", async () => {
    const onLimitReached = jest.fn();

    await render(
      <Timer
        limit={250}
        initialActiveElapsedMs={250}
        onActiveElapsedChange={() => undefined}
        onLimitReached={onLimitReached}
      />,
    );

    await act(async () => {
      jest.advanceTimersByTime(750);
    });

    expect(onLimitReached).toHaveBeenCalledTimes(1);
  });

  it("does not arm completion when the timer is unlimited", async () => {
    const onLimitReached = jest.fn();

    await render(
      <Timer
        limit={0}
        initialActiveElapsedMs={0}
        onActiveElapsedChange={() => undefined}
        onLimitReached={onLimitReached}
      />,
    );

    await act(async () => {
      jest.advanceTimersByTime(750);
    });

    expect(onLimitReached).not.toHaveBeenCalled();
  });
});
