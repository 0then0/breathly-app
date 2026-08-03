import * as SplashScreen from "expo-splash-screen";
import React, { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Platform, StyleSheet, useColorScheme, View } from "react-native";
import {
  getRemainingSplashDurationMs,
  maximumSplashWaitMs,
} from "@breathly/core/splash-screen-timing";
import { useHomeScreenStatusStore } from "@breathly/screens/home-screen/home-screen";

if (Platform.OS !== "web") {
  // This must run before React mounts so native startup remains covered while JS initializes.
  void SplashScreen.preventAutoHideAsync().catch(() => undefined);
}

// The same two assets the native splash uses, so the hand-off from the launch screen to
// this overlay draws exactly the same thing.
const splashImageAssets = {
  light: require("../../assets/splash.png"),
  dark: require("../../assets/splash-dark.png"),
};

// Keep these in step with the `expo-splash-screen` plugin config in `app.json`.
const splashBackgroundColors = {
  light: "#F2F2F1",
  dark: "#0f172a",
};

export const SplashScreenManager: React.FC<PropsWithChildren> = ({ children }) => {
  if (Platform.OS === "web") return <>{children}</>;
  return <NativeSplashScreenManager>{children}</NativeSplashScreenManager>;
};

const NativeSplashScreenManager: React.FC<PropsWithChildren> = ({ children }) => {
  // The *system* appearance, not the app's resolved theme. The native launch screen can only
  // follow the system, and the settings store has not hydrated yet at this point, so reading
  // anything else here would make the two layers disagree.
  const systemColorScheme = useColorScheme() === "dark" ? "dark" : "light";
  const mountedAtMs = useRef(Date.now()).current;
  const opacity = useMemo(() => new Animated.Value(1), []);
  const isHomeScreenReady = useHomeScreenStatusStore((state) => state.isHomeScreenReady);
  const [isOverlayReady, setOverlayReady] = useState(false);
  const [isSplashComplete, setSplashComplete] = useState(false);
  const nativeHideRequested = useRef(false);
  const revealRequested = useRef(false);
  const revealTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const hideNativeSplash = useCallback(() => {
    if (nativeHideRequested.current) return;
    nativeHideRequested.current = true;
    void SplashScreen.hideAsync().catch(() => undefined);
  }, []);

  const revealApp = useCallback(() => {
    if (revealRequested.current) return;
    revealRequested.current = true;
    hideNativeSplash();

    const remainingDurationMs = getRemainingSplashDurationMs(mountedAtMs, Date.now());
    revealTimeout.current = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.quad),
      }).start(({ finished }) => {
        if (finished) setSplashComplete(true);
      });
    }, remainingDurationMs);
  }, [hideNativeSplash, mountedAtMs, opacity]);

  const handleOverlaySettled = useCallback(() => {
    setOverlayReady(true);
    hideNativeSplash();
  }, [hideNativeSplash]);

  useEffect(() => {
    if (isOverlayReady && isHomeScreenReady) revealApp();
  }, [isHomeScreenReady, isOverlayReady, revealApp]);

  useEffect(() => {
    const watchdog = setTimeout(revealApp, maximumSplashWaitMs);
    return () => {
      clearTimeout(watchdog);
      if (revealTimeout.current) clearTimeout(revealTimeout.current);
      opacity.stopAnimation();
    };
  }, [opacity, revealApp]);

  return (
    <View style={styles.container}>
      {children}
      {!isSplashComplete && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.overlay,
            { opacity, backgroundColor: splashBackgroundColors[systemColorScheme] },
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Animated.Image
            style={styles.image}
            source={splashImageAssets[systemColorScheme]}
            resizeMode="cover"
            onLoadEnd={handleOverlaySettled}
            fadeDuration={0}
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
