import { Platform, StatusBar } from "react-native";
import { useColorScheme } from "@breathly/design/theme";

export const useThemedStatusBar = () => {
  const colorScheme = useColorScheme();

  if (Platform.OS === "ios") {
    StatusBar.setBarStyle(colorScheme === "dark" ? "light-content" : "dark-content", true);
  }
};
