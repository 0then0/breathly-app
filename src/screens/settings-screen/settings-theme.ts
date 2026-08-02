// Native-settings background tones for the settings stack. Only Android has
// them (see settings-theme.android.ts); other platforms keep the app theme.
// The parameter must stay so the signature matches the Android variant.
export const useNativeSettingsTheme = (
  _colorScheme: "light" | "dark",
): { background: string } | undefined => undefined;
