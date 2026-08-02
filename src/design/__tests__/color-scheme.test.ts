import { resolveColorScheme } from "../color-scheme";

describe("color scheme resolution", () => {
  it("follows the system appearance while the user follows the system", () => {
    expect(resolveColorScheme("dark", true, "light")).toBe("dark");
    expect(resolveColorScheme("light", true, "dark")).toBe("light");
  });

  it("uses the stored theme once the user stops following the system", () => {
    expect(resolveColorScheme("light", false, "dark")).toBe("dark");
    expect(resolveColorScheme("dark", false, "light")).toBe("light");
  });

  it("falls back to light when the system appearance is unspecified", () => {
    expect(resolveColorScheme("unspecified", true, "dark")).toBe("light");
  });

  it("ignores an unspecified system appearance once the user picks a theme", () => {
    expect(resolveColorScheme("unspecified", false, "dark")).toBe("dark");
  });
});
