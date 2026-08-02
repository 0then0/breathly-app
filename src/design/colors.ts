// The palette. The values come from the Tailwind v3 default palette, which the app
// used through NativeWind until the styles moved to StyleSheet. They are inlined here
// so that the app does not depend on `tailwindcss` at runtime.
export const colors = {
  white: "#ffffff",
  "gray-100": "#f3f4f6", // Web settings row background
  "gray-300": "#d1d5db", // Web settings radio button border
  "stone-100": "#f5f5f4", // Light background
  "stone-200": "#e7e5e4", // Borders in settings
  "stone-300": "#d6d3d1", // Disabled controls in settings
  "slate-300": "#cbd5e1", // Web settings section bottom border
  "slate-500": "#64748b", // Secondary text in light mode, settings borders
  "slate-600": "#475569", // Settings stepper border in dark mode
  "slate-700": "#334155", // Settings bg border in dark mode
  "slate-800": "#1e293b", // Primary text in light mode
  "slate-900": "#0f172a", // Dark background
  "blue-400": "#60a5fa", // Android settings tint
  "blue-500": "#3b82f6", // iOS settings tint
  pastel: {
    orange: "#F2CAAD", // Home screen planet
    gray: "#E1E3DC", // Home screen planet
    green: "#ECE9B7", // Home screen planet
    "orange-light": "#F1E0D9", // Home screen button
    "gray-light": "#E7E9E6", // Home screen button
  },
};
