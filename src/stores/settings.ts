import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { create } from "zustand";
import {
  persist,
  subscribeWithSelector,
  type PersistStorage,
  type StorageValue,
} from "zustand/middleware";
import { patternPresets } from "@breathly/assets/pattern-presets";
import {
  adjustTimeLimit,
  defaultSettingsState,
  mergePersistedSettingsState,
  setCustomPatternStepValue,
  timeLimitStepMs,
  type PersistedSettingsState,
  type Theme,
} from "@breathly/stores/settings-state";
import { GuidedBreathingMode } from "@breathly/types/guided-breathing-mode";

interface SettingsStore extends PersistedSettingsState {
  setCustomPatternEnabled: (enabled: boolean) => unknown;
  setCustomPatternStep: (stepIndex: number, stepValue: number) => unknown;
  setSelectedPatternPresetId: (patternPresetId: string) => unknown;
  setGuidedBreathingVoice: (guidedBreathingVoice: GuidedBreathingMode) => unknown;
  increaseTimeLimit: () => unknown;
  decreaseTimeLimit: () => unknown;
  setShouldFollowSystemDarkMode: (shouldFollowSystemDarkMode: boolean) => unknown;
  setTheme: (theme: Theme) => unknown;
  setVibrationEnabled: (vibrationEnabled: boolean) => unknown;
}

// An unreadable or damaged payload must never stop hydration. Zustand leaves `hasHydrated`
// false when the read rejects, `useHydration` then never turns true, and the app renders an
// empty view on every launch — with no way back, because the app has no network. Both
// failures mean the same thing here: there are no usable stored settings. Report that, and
// let the store start from its defaults.
const settingsStorage: PersistStorage<SettingsStore> = {
  getItem: async (name) => {
    try {
      const storedValue = await AsyncStorage.getItem(name);
      if (storedValue == null) return null;
      return JSON.parse(storedValue) as StorageValue<SettingsStore>;
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    try {
      await AsyncStorage.setItem(name, JSON.stringify(value));
    } catch {
      // A failed write costs the user one setting. Rejecting would only add an unhandled
      // rejection on top, and would not bring the value back.
    }
  },
  removeItem: async (name) => {
    try {
      await AsyncStorage.removeItem(name);
    } catch {
      // Same reasoning as `setItem`.
    }
  },
};

export const useSettingsStore = create<SettingsStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...defaultSettingsState,
        setCustomPatternEnabled: (enabled) => set({ customPatternEnabled: enabled }),
        setCustomPatternStep: (stepIndex, stepValue) => {
          set({
            customPatternSteps: setCustomPatternStepValue(
              get().customPatternSteps,
              stepIndex,
              stepValue,
            ),
          });
        },
        setSelectedPatternPresetId: (selectedPatternPresetId) => set({ selectedPatternPresetId }),
        setGuidedBreathingVoice: (guidedBreathingVoice) => set({ guidedBreathingVoice }),
        increaseTimeLimit: () =>
          set({ timeLimit: adjustTimeLimit(get().timeLimit, timeLimitStepMs) }),
        decreaseTimeLimit: () =>
          set({ timeLimit: adjustTimeLimit(get().timeLimit, -timeLimitStepMs) }),
        setShouldFollowSystemDarkMode: (shouldFollowSystemDarkMode) =>
          set({ shouldFollowSystemDarkMode }),
        setTheme: (theme) => set({ theme }),
        setVibrationEnabled: (vibrationEnabled) => set({ vibrationEnabled }),
      }),
      {
        name: "settings-storage",
        storage: settingsStorage,
        merge: mergePersistedSettingsState,
      },
    ),
  ),
);

export const useSelectedPatternName = () =>
  useSettingsStore((state) =>
    state.customPatternEnabled
      ? "Custom"
      : (patternPresets.find((patternPreset) => patternPreset.id === state.selectedPatternPresetId)
          ?.name ?? patternPresets[0].name),
  );

export const useSelectedPatternSteps = () =>
  useSettingsStore((state) =>
    state.customPatternEnabled
      ? state.customPatternSteps
      : (patternPresets.find((patternPreset) => patternPreset.id === state.selectedPatternPresetId)
          ?.steps ?? patternPresets[0].steps),
  );

// https://github.com/pmndrs/zustand/blob/725c2c0cc08df936f42a52e3df3dec76780a6e01/docs/integrations/persisting-store-data.md
export const useHydration = () => {
  const [hydrated, setHydrated] = useState(useSettingsStore.persist.hasHydrated);

  useEffect(() => {
    const unsubFinishHydration = useSettingsStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    setHydrated(useSettingsStore.persist.hasHydrated());
    return () => {
      unsubFinishHydration();
    };
  }, []);

  return hydrated;
};
