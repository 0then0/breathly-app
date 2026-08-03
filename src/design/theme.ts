import { useColorScheme as useSystemColorScheme } from "react-native";
import { resolveColorScheme, type ColorScheme } from "@breathly/design/color-scheme";
import { themeColors, type ThemeColors } from "@breathly/design/colors";
import { useSettingsStore } from "@breathly/stores/settings";

export { type ColorScheme, type ThemeColors };

// The color scheme that the app renders with.
//
// NativeWind used to own this state, and the app pushed the setting into it. The value
// is derived from the settings store instead, so that there is one source of truth.
// `resolveColorScheme` holds the rule itself, so that it can be tested on its own.
export const useColorScheme = (): ColorScheme => {
  const systemColorScheme = useSystemColorScheme();
  const shouldFollowSystemDarkMode = useSettingsStore((state) => state.shouldFollowSystemDarkMode);
  const theme = useSettingsStore((state) => state.theme);
  return resolveColorScheme(systemColorScheme, shouldFollowSystemDarkMode, theme);
};

// The colours for the scheme the app is rendering with. Prefer this over reaching into the
// palette and writing a `*Dark` style beside every rule: a role that exists here cannot be
// left without a dark value by accident.
export const useThemeColors = (): ThemeColors => themeColors[useColorScheme()];
