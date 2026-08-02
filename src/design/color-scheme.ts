import { type ColorSchemeName } from "react-native";
import { type Theme } from "@breathly/stores/settings-state";

export type ColorScheme = Theme;

// Picks the color scheme the app renders with. The system appearance wins while the
// user follows the system; the stored theme wins in all other cases. React Native
// also reports "unspecified", which falls back to light like any non-dark value.
export const resolveColorScheme = (
  systemColorScheme: ColorSchemeName,
  shouldFollowSystemDarkMode: boolean,
  theme: Theme,
): ColorScheme => {
  if (shouldFollowSystemDarkMode) {
    return systemColorScheme === "dark" ? "dark" : "light";
  }
  return theme;
};
