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
  // Rendered by the iOS implementation only.
  iconName?: string;
  iconBackgroundColor?: string;
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

export declare const SettingsUI: {
  Section: React.FC<PropsWithChildren<SectionProps>>;
  Header: React.FC<HeaderProps>;
  LinkItem: React.FC<LinkItemProps>;
  PickerItem: React.FC<PickerItemProps>;
  SwitchItem: React.FC<SwitchItemProps>;
  StepperItem: React.FC<StepperItemProps>;
  RadioButtonItem: React.FC<RadioButtonItemProps>;
};
