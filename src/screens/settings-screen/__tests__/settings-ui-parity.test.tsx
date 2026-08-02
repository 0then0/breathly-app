import { render, screen } from "@testing-library/react-native";
import React from "react";
import { SettingsUI as IosSettingsUI } from "../settings-ui.ios";
import { SettingsUI as WebSettingsUI } from "../settings-ui.web";
import type { SettingsUIModule } from "../settings-ui.types";

// The three platform implementations are written separately on purpose — Android uses real
// Jetpack Compose components — but they have to behave the same where it matters. Nothing
// compared them before, and three behaviours had already drifted apart.
//
// Android is not rendered here: its components come from `@expo/ui/jetpack-compose` and need
// the native runtime. Its conformance is checked by the compiler through `SettingsUIModule`.
const implementations: [string, SettingsUIModule][] = [
  ["ios", IosSettingsUI],
  ["web", WebSettingsUI],
];

describe.each(implementations)("the %s settings UI", (_platform, SettingsUI) => {
  it("provides every component the contract names", () => {
    const required: (keyof SettingsUIModule)[] = [
      "Section",
      "Header",
      "LinkItem",
      "PickerItem",
      "SwitchItem",
      "StepperItem",
      "RadioButtonItem",
    ];

    for (const component of required) {
      expect(SettingsUI[component]).toBeDefined();
    }
  });

  it("shows the field name on a picker, not only its options", async () => {
    // The web implementation spread the shared props and then overrode `label` with each
    // option's own label, so the user saw unnamed rows with no "Voice" anywhere on screen.
    await render(
      <SettingsUI.PickerItem
        label="Voice"
        value="paul"
        options={[
          { value: "laura", label: "Laura" },
          { value: "paul", label: "Paul" },
        ]}
        onValueChange={() => undefined}
        testID="settings.voice"
      />,
    );

    expect(screen.queryByText("Voice")).not.toBeNull();
  });

  it("names both stepper buttons for a screen reader", async () => {
    await render(
      <SettingsUI.StepperItem
        label="Exercise timer"
        value={2}
        onIncrease={() => undefined}
        onDecrease={() => undefined}
        testID="settings.timer"
      />,
    );

    // Android's Compose buttons hold only "−" and "+", so TalkBack reads two unnamed symbols
    // with no clue what they change. iOS and web name them; the contract should require it.
    expect(screen.queryByLabelText(/increase/i)).not.toBeNull();
    expect(screen.queryByLabelText(/decrease/i)).not.toBeNull();
  });

  it("exposes the stepper controls under their test ids", async () => {
    await render(
      <SettingsUI.StepperItem
        label="Exercise timer"
        value={2}
        onIncrease={() => undefined}
        onDecrease={() => undefined}
        testID="settings.timer"
      />,
    );

    expect(screen.queryByTestId("settings.timer.value")).not.toBeNull();
    expect(screen.queryByTestId("settings.timer.increase")).not.toBeNull();
    expect(screen.queryByTestId("settings.timer.decrease")).not.toBeNull();
  });

  it("tells a screen reader when a radio row is disabled", async () => {
    await render(
      <SettingsUI.RadioButtonItem
        label="Square"
        selected={false}
        disabled
        onPress={() => undefined}
        testID="settings.pattern.square"
      />,
    );

    const row = screen.getByTestId("settings.pattern.square");
    expect(row.props.accessibilityState?.disabled).toBe(true);
  });
});
