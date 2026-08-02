import { Platform } from "react-native";

export const fontFamilies = {
  serifMedium: "Lora-Medium",
  serifSemibold: "Lora-SemiBold",
  regular: "GeneralSans-Regular",
  medium: "GeneralSans-Medium",
  // The timer and the stepper values use a thin system face, as they did through
  // the NativeWind `platformSelect` font. Web keeps the platform default.
  mono: Platform.select({ ios: "HelveticaNeue-Light", android: "sans-serif-thin" }),
};

// The font size and line height pairs of the Tailwind v3 type scale, which the app
// used through NativeWind. `xxl5` has no line height, because Tailwind pairs it with
// a unitless value that NativeWind could not convert and therefore dropped.
export const fontSizes = {
  xs: { fontSize: 12, lineHeight: 16 },
  sm: { fontSize: 14, lineHeight: 20 },
  base: { fontSize: 16, lineHeight: 24 },
  lg: { fontSize: 18, lineHeight: 28 },
  xl: { fontSize: 20, lineHeight: 28 },
  xxl2: { fontSize: 24, lineHeight: 32 },
  xxl5: { fontSize: 48 },
} as const;
