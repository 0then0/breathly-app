import { useColorScheme as useSystemColorScheme } from "react-native";
import { useSettingsStore } from "@breathly/stores/settings";
import { type Theme } from "@breathly/stores/settings-state";

export type ColorScheme = Theme;

// The color scheme that the app renders with. It is the system appearance when the
// user follows the system, and the stored preference in all other cases.
//
// NativeWind used to own this state, and the app pushed the setting into it. The value
// is derived from the settings store instead, so that there is one source of truth.
export const useColorScheme = (): ColorScheme => {
  const systemColorScheme = useSystemColorScheme();
  const shouldFollowSystemDarkMode = useSettingsStore((state) => state.shouldFollowSystemDarkMode);
  const theme = useSettingsStore((state) => state.theme);
  if (shouldFollowSystemDarkMode) {
    return systemColorScheme === "dark" ? "dark" : "light";
  }
  return theme;
};

// True when the app renders in dark mode. A shorthand for the common check.
export const useIsDarkMode = (): boolean => useColorScheme() === "dark";
