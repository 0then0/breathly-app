// Native-settings background tones for the settings stack. Only Android has
// them (see settings-theme.android.ts); other platforms keep the app theme.
// The parameter must stay so the signature matches the Android variant.
export const useNativeSettingsTheme = (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _colorScheme: "light" | "dark"
): { background: string } | undefined => undefined;
