import { act, fireEvent, render } from "@testing-library/react-native";
import React from "react";
import { Alert, AppState } from "react-native";
import { saveCompletedBreathingSession } from "@breathly/services/health-connect";
import { ExerciseScreen } from "../exercise-screen";

let onAppStateChange: ((state: "active" | "background") => void) | undefined;
let onStepUpdate: ((previousStep: { id: "exhale" | "afterExhale" }) => void) | undefined;
let mockCurrentStepId: "inhale" | "afterExhale" = "inhale";

jest.mock("expo-keep-awake", () => ({ useKeepAwake: jest.fn() }));
jest.mock("@expo/vector-icons/Ionicons", () => "Ionicons");
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock("@breathly/design/theme", () => ({
  useColorScheme: () => "light",
  useThemeColors: () => ({ control: "#000", textSecondary: "#000" }),
}));
jest.mock("@breathly/utils/use-accessibility-preferences", () => ({
  useScreenReaderEnabled: () => false,
}));
jest.mock("@breathly/utils/animate", () => ({
  animate: () => ({
    start: (callback: (result: { finished: boolean }) => void) => callback({ finished: true }),
  }),
}));
jest.mock("@breathly/utils/use-on-update", () => ({
  useOnUpdate: (callback: (previousStep: { id: "exhale" | "afterExhale" }) => void) => {
    onStepUpdate = callback;
  },
}));
jest.mock("@breathly/utils/build-steps-metadata", () => ({
  buildStepsMetadata: () => [],
}));
jest.mock("@breathly/screens/exercise-screen/accessibility-announcements", () => ({
  announceForScreenReader: jest.fn(),
  announceLiveRegionUpdate: jest.fn(),
  getStepAccessibilityLabel: jest.fn(),
  sessionPausedAnnouncement: "Paused",
}));
jest.mock("@breathly/screens/exercise-screen/use-exercise-audio", () => ({
  useExerciseAudio: () => ({
    playExerciseStepAudio: jest.fn(),
    playExerciseCompletedAudio: jest.fn(),
    stopExerciseAudio: jest.fn(),
  }),
}));
jest.mock("@breathly/screens/exercise-screen/use-exercise-haptics", () => ({
  useExerciseHaptics: () => jest.fn(),
}));
jest.mock("@breathly/screens/exercise-screen/use-exercise-loop", () => ({
  useExerciseLoop: () => ({
    currentStep: { id: mockCurrentStepId, duration: 1_000, label: "Inhale" },
    exerciseAnimVal: { interpolate: jest.fn() },
    textAnimVal: { interpolate: jest.fn() },
  }),
}));
jest.mock("@breathly/screens/exercise-screen/animated-dots", () => ({
  AnimatedDots: () => null,
}));
jest.mock("@breathly/screens/exercise-screen/breathing-animation", () => ({
  BreathingAnimation: () => null,
}));
jest.mock("@breathly/screens/exercise-screen/step-description", () => ({
  StepDescription: () => null,
}));
jest.mock("@breathly/screens/home-screen/stars-background", () => ({
  StarsBackground: () => null,
}));
jest.mock("../complete", () => {
  const { Text } = require("react-native");
  return { ExerciseComplete: () => <Text>Completed</Text> };
});
jest.mock("../interlude", () => ({
  ExerciseInterlude: ({
    onComplete,
    preparationTime,
  }: {
    onComplete: () => void;
    preparationTime: number;
  }) => {
    const { Text } = require("react-native");
    return (
      <Text testID="exercise.interlude" onPress={onComplete}>
        Start {preparationTime}
      </Text>
    );
  },
}));
jest.mock("../timer", () => ({
  Timer: ({ onLimitReached }: { onLimitReached: () => void }) => {
    const { useEffect } = require("react");
    useEffect(onLimitReached, [onLimitReached]);
    return null;
  },
}));

const mockSetHealthConnectEnabled = jest.fn();
jest.mock("@breathly/stores/settings", () => ({
  useSettingsStore: (selector?: (state: Record<string, unknown>) => unknown) => {
    const state = {
      guidedBreathingVoice: "paul",
      preparationTime: 30_000,
      healthConnectEnabled: true,
      setHealthConnectEnabled: mockSetHealthConnectEnabled,
      timeLimit: 60_000,
      vibrationEnabled: false,
    };
    return selector ? selector(state) : state;
  },
  useSelectedPatternSteps: () => [],
}));
jest.mock("@breathly/services/health-connect", () => ({
  saveCompletedBreathingSession: jest.fn(),
}));

const mockSaveCompletedBreathingSession = jest.mocked(saveCompletedBreathingSession);

describe("ExerciseScreen Health Connect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    onAppStateChange = undefined;
    onStepUpdate = undefined;
    mockCurrentStepId = "inhale";
    mockSaveCompletedBreathingSession.mockResolvedValue("saved");
    jest.spyOn(AppState, "addEventListener").mockImplementation((_event, listener) => {
      onAppStateChange = listener as (state: "active" | "background") => void;
      return { remove: jest.fn() };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("records active intervals before and after a background pause", async () => {
    let now = 1_000;
    jest.spyOn(Date, "now").mockImplementation(() => now);
    const screen = await render(
      <ExerciseScreen navigation={{ goBack: jest.fn() } as never} route={{} as never} />,
    );

    await act(async () => {
      await fireEvent.press(screen.getByTestId("exercise.interlude"));
    });
    now = 5_000;
    await act(async () => {
      onAppStateChange?.("background");
    });
    now = 8_000;
    await act(async () => {
      await fireEvent.press(screen.getByTestId("exercise.resume"));
    });
    now = 12_000;
    await act(async () => {
      onStepUpdate?.({ id: "exhale" });
    });
    await act(async () => undefined);

    expect(mockSaveCompletedBreathingSession.mock.calls.map(([segment]) => segment)).toEqual([
      { startedAtMs: 1_000, completedAtMs: 5_000, clientRecordId: "breathly-1000-0" },
      { startedAtMs: 8_000, completedAtMs: 12_000, clientRecordId: "breathly-1000-1" },
    ]);
  });

  it("exports only completed active intervals after countdown, final hold and resume", async () => {
    let now = 1_000;
    jest.spyOn(Date, "now").mockImplementation(() => now);
    const props = { navigation: { goBack: jest.fn() } as never, route: {} as never };
    const screen = await render(<ExerciseScreen {...props} />);
    expect(screen.getByText("Start 30000")).toBeTruthy();
    now = 10_000;
    await act(async () => onAppStateChange?.("background"));
    await fireEvent.press(screen.getByTestId("exercise.resume"));
    expect(screen.getByText("Start 30000")).toBeTruthy();
    expect(mockSaveCompletedBreathingSession).not.toHaveBeenCalled();

    now = 41_000;
    await fireEvent.press(screen.getByTestId("exercise.interlude"));
    mockCurrentStepId = "afterExhale";
    await screen.rerender(<ExerciseScreen {...props} />);
    await act(async () => onStepUpdate?.({ id: "exhale" }));
    expect(screen.queryByText("Completed")).toBeNull();
    expect(mockSaveCompletedBreathingSession).not.toHaveBeenCalled();

    now = 50_000;
    await act(async () => onAppStateChange?.("background"));
    now = 55_000;
    await fireEvent.press(screen.getByTestId("exercise.resume"));
    expect(mockSaveCompletedBreathingSession).not.toHaveBeenCalled();
    mockCurrentStepId = "inhale";
    await screen.rerender(<ExerciseScreen {...props} />);
    now = 60_000;
    await act(async () => {
      onStepUpdate?.({ id: "afterExhale" });
      onStepUpdate?.({ id: "afterExhale" });
    });
    expect(screen.getByText("Completed")).toBeTruthy();
    expect(mockSaveCompletedBreathingSession.mock.calls.map(([segment]) => segment)).toEqual([
      { startedAtMs: 41_000, completedAtMs: 50_000, clientRecordId: "breathly-1000-0" },
      { startedAtMs: 55_000, completedAtMs: 60_000, clientRecordId: "breathly-1000-1" },
    ]);
  });

  it("explains when a clock change makes the completed interval invalid", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    let now = 1_000;
    jest.spyOn(Date, "now").mockImplementation(() => now);
    const screen = await render(
      <ExerciseScreen navigation={{ goBack: jest.fn() } as never} route={{} as never} />,
    );

    await act(async () => {
      await fireEvent.press(screen.getByTestId("exercise.interlude"));
    });
    now = 500;
    await act(async () => {
      onStepUpdate?.({ id: "exhale" });
    });

    expect(mockSaveCompletedBreathingSession).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith(
      "Health Connect",
      "Breathly could not save this exercise to Health Connect.",
    );
    alertSpy.mockRestore();
  });
});
