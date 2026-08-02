import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";
import React, { FC } from "react";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "@breathly/design/colors";
import { ExerciseScreen } from "@breathly/screens/exercise-screen/exercise-screen";
import { HomeScreen } from "@breathly/screens/home-screen/home-screen";
import {
  SettingsRootScreen,
  SettingsPatternPickerScreen,
} from "@breathly/screens/settings-screen/settings-screen";
import { useNativeSettingsTheme } from "@breathly/screens/settings-screen/settings-theme";

export type RootStackParamList = {
  Home: undefined;
  Exercise: undefined;
  Settings: undefined;
};
const RootStack = createNativeStackNavigator<RootStackParamList>();

export type SettingsStackParamList = {
  SettingsRoot: undefined;
  SettingsPatternPicker: undefined;
};

const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

export const Navigator: FC = () => {
  const { colorScheme } = useNativeWindColorScheme();
  const baseTheme = colorScheme === "dark" ? DarkTheme : DefaultTheme;
  const backgroundColor = colorScheme === "dark" ? colors["slate-900"] : colors["stone-100"];
  // On Android the settings stack matches the stock settings app: window and
  // top bar use the Material window tone instead of the app background.
  const nativeSettingsTheme = useNativeSettingsTheme(colorScheme === "dark" ? "dark" : "light");
  const theme = {
    ...baseTheme,
    dark: colorScheme === "dark",
    colors: {
      ...baseTheme.colors,
      background: backgroundColor,
    },
  };
  return (
    <SafeAreaProvider style={{ backgroundColor }}>
      <NavigationContainer theme={theme}>
        <RootStack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerShown: false,
          }}
        >
          <RootStack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              animation: Platform.OS === "ios" ? "fade" : "simple_push",
            }}
          />
          <RootStack.Screen
            name="Exercise"
            component={ExerciseScreen}
            options={{
              animation: Platform.OS === "ios" ? "fade" : "simple_push",
            }}
          />
          <RootStack.Screen
            name="Settings"
            options={{
              presentation: Platform.select({
                ios: "formSheet",
              }),
            }}
          >
            {() => {
              const settingsBackgroundColor =
                nativeSettingsTheme?.background ??
                (colorScheme === "dark" ? colors["slate-900"] : colors["stone-100"]);
              const commonHeaderSettings = {
                // Android draws its own stock-style title bar inside the screen
                // (SettingsUI.Header); the native-stack header stays hidden there.
                headerShown: Platform.OS !== "android",
                headerShadowVisible: Platform.OS === "ios",
                headerStyle: {
                  backgroundColor: settingsBackgroundColor,
                },
                contentStyle: {
                  backgroundColor: settingsBackgroundColor,
                },
                // Android follows the Material top-app-bar convention: title and
                // navigation icon use the on-surface color, not an accent color.
                headerTintColor:
                  Platform.OS === "ios"
                    ? undefined
                    : colorScheme === "dark"
                      ? "#ffffff"
                      : colors["slate-800"],
              };
              return (
                <SettingsStack.Navigator initialRouteName="SettingsRoot">
                  <SettingsStack.Screen
                    name="SettingsRoot"
                    component={SettingsRootScreen}
                    options={{
                      ...commonHeaderSettings,
                      headerLargeTitle: true,
                      headerTitle: "Customizations",
                      headerLargeTitleShadowVisible: true,
                    }}
                  />
                  <SettingsStack.Screen
                    name="SettingsPatternPicker"
                    component={SettingsPatternPickerScreen}
                    options={{
                      headerTitle: "Breathing Patterns",
                      ...commonHeaderSettings,
                    }}
                  />
                </SettingsStack.Navigator>
              );
            }}
          </RootStack.Screen>
        </RootStack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};
