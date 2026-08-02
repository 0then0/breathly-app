import { useMaterialColors } from "@expo/ui/jetpack-compose";

// Matches the stock Android settings app, measured on a Pixel emulator: the
// window (and top app bar) uses `surfaceContainer` in both color schemes, so
// the brighter `surfaceBright` preference cards read as elevated.
export const useNativeSettingsTheme = (
  colorScheme: "light" | "dark",
): { background: string } | undefined => {
  const colors = useMaterialColors({ colorScheme });
  return { background: colors.surfaceContainer };
};
