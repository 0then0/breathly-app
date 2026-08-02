import { themeColors } from "../colors";

// WCAG 2.x relative luminance and contrast ratio.
const channelLuminance = (channel: number) => {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const relativeLuminance = (hex: string) => {
  const value = hex.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return (
    0.2126 * channelLuminance(red) +
    0.7152 * channelLuminance(green) +
    0.0722 * channelLuminance(blue)
  );
};

const contrastRatio = (foreground: string, background: string) => {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
};

const bodyTextMinimum = 4.5; // WCAG 1.4.3
const controlMinimum = 3; // WCAG 1.4.11

describe.each(["light", "dark"] as const)("the %s scheme", (scheme) => {
  const theme = themeColors[scheme];

  it("keeps primary text legible on the background", () => {
    expect(contrastRatio(theme.text, theme.background)).toBeGreaterThanOrEqual(bodyTextMinimum);
  });

  it("keeps secondary text legible on the background", () => {
    // The app used one secondary colour with no dark counterpart, so this failed in both
    // schemes and worse in dark. The roles carry a value per scheme now.
    expect(contrastRatio(theme.textSecondary, theme.background)).toBeGreaterThanOrEqual(
      bodyTextMinimum,
    );
  });

  it("keeps secondary text legible on a surface", () => {
    expect(contrastRatio(theme.textSecondary, theme.surface)).toBeGreaterThanOrEqual(
      bodyTextMinimum,
    );
  });

  it("keeps controls visible against the background", () => {
    // The exercise screen's close button is the only way out of a session, and it measured
    // 1.37:1 in light mode.
    expect(contrastRatio(theme.control, theme.background)).toBeGreaterThanOrEqual(controlMinimum);
  });
});

describe("the contrast helper", () => {
  it("agrees with the known extremes", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
  });
});
