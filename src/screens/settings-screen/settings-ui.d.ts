import React from "react";
import { PropsWithChildren } from "react";

export interface SectionProps {
  label: string;
  hideBottomBorderAndroid?: boolean;
}

interface CommonItemProps {
  label?: string;
  secondaryLabel?: string;
  testID?: string;
}

export interface LinkItemProps extends CommonItemProps {
  value: string;
  onPress: () => unknown;
}

export interface PickerItemProps extends CommonItemProps {
  value: string;
  options: { label: string; value: string }[];
  onValueChange: (value: string) => unknown;
}

export interface SwitchItemProps extends CommonItemProps {
  value: boolean;
  onValueChange?: (newValue: boolean) => void;
}

export interface StepperItemProps extends CommonItemProps {
  value?: number | string;
  increaseDisabled?: boolean;
  decreaseDisabled?: boolean;
  onIncrease?: () => unknown;
  onDecrease?: () => unknown;
  fractionDigits?: number;
  // When these are present, platforms with a native ranged control (Android)
  // render a slider instead of the +/- stepper buttons.
  onChange?: (value: number) => unknown;
  minimumValue?: number;
  maximumValue?: number;
  formatValue?: (value: number) => string;
}

export interface HeaderProps {
  title: string;
  onBack: () => void;
}

export interface RadioButtonItemProps extends CommonItemProps {
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

declare const SettingsUI: {
  Section: React.FC<PropsWithChildren<SectionProps>>;
  Header: React.FC<HeaderProps>;
  LinkItem: FC<LinkItemProps>;
  PickerItem: FC<SettingsItemPicker>;
  SwitchItem: FC<SwitchItemProps>;
  StepperItem: FC<StepperItemProps>;
  RadioButtonItem: FC<RadioButtonItemProps>;
};
