import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
  type AudioSource,
} from "expo-audio";
import { Asset } from "expo-asset";
import { Platform } from "react-native";
import { sounds } from "@breathly/assets/sounds";
import { GuidedBreathingMode } from "@breathly/types/guided-breathing-mode";
import { GuidedBreathingStep } from "@breathly/types/guided-breathing-step";

const configureAudioMode = () =>
  setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    interruptionMode: Platform.OS === "android" ? "duckOthers" : "mixWithOthers",
  });

type GuidedBreathingAudioSounds = {
  [key in GuidedBreathingMode]: {
    [key in GuidedBreathingStep]: AudioSource | undefined;
  };
};

const guidedBreathingAudioAssets: GuidedBreathingAudioSounds = {
  laura: {
    breatheIn: sounds.lauraBreatheIn,
    breatheOut: sounds.lauraBreatheOut,
    hold: sounds.lauraHold,
  },
  paul: {
    breatheIn: sounds.paulBreatheIn,
    breatheOut: sounds.paulBreatheOut,
    hold: sounds.paulHold,
  },
  bell: {
    breatheIn: sounds.cueBell1,
    breatheOut: sounds.cueBell1,
    hold: sounds.cueBell2,
  },
  disabled: {
    breatheIn: undefined,
    breatheOut: undefined,
    hold: undefined,
  },
};

type CurrentGuidedBreathingSounds = {
  [key in GuidedBreathingStep]: AudioPlayer;
};

let currentGuidedBreathingSounds: CurrentGuidedBreathingSounds | undefined;
let endingBellSound: AudioPlayer | undefined;
let audioOperation = Promise.resolve();
let requestedAudioGeneration = 0;

const enqueueAudioOperation = (operation: () => Promise<void>) => {
  const result = audioOperation.then(operation, operation);
  audioOperation = result.catch(() => undefined);
  return result;
};

const disposeCurrentAudio = async () => {
  const guidedBreathingSounds = currentGuidedBreathingSounds;
  const bellSound = endingBellSound;

  currentGuidedBreathingSounds = undefined;
  endingBellSound = undefined;

  bellSound?.remove();
  guidedBreathingSounds?.breatheIn.remove();
  guidedBreathingSounds?.breatheOut.remove();
  guidedBreathingSounds?.hold.remove();
};

const prepareAudioSource = async (source: AudioSource): Promise<AudioSource> => {
  if (typeof source !== "number") return source;

  // Materialize bundled audio before creating the native player. This gives setup
  // an awaitable readiness boundary and avoids Android resource-URI loading races.
  const asset = Asset.fromModule(source);
  await asset.downloadAsync();

  return {
    assetId: source,
    uri: asset.localUri ?? asset.uri,
  };
};

const prepareOptionalAudioSource = async (
  source: AudioSource | undefined
): Promise<AudioSource | undefined> => (source == null ? undefined : prepareAudioSource(source));

export function setupGuidedBreathingAudio(guidedBreathingMode: GuidedBreathingMode) {
  const audioGeneration = ++requestedAudioGeneration;
  const stepAudioSources = guidedBreathingAudioAssets[guidedBreathingMode];

  return enqueueAudioOperation(async () => {
    await disposeCurrentAudio();
    if (audioGeneration !== requestedAudioGeneration) return;

    await configureAudioMode();
    const [endingBellSource, breatheInSource, breatheOutSource, holdSource] = await Promise.all([
      prepareAudioSource(sounds.endingBell),
      prepareOptionalAudioSource(stepAudioSources.breatheIn),
      prepareOptionalAudioSource(stepAudioSources.breatheOut),
      prepareOptionalAudioSource(stepAudioSources.hold),
    ]);
    if (audioGeneration !== requestedAudioGeneration) return;

    endingBellSound = createAudioPlayer(endingBellSource);
    // Modes without step cues (e.g. "disabled") keep only the ending bell.
    if (breatheInSource != null && breatheOutSource != null && holdSource != null) {
      currentGuidedBreathingSounds = {
        breatheIn: createAudioPlayer(breatheInSource),
        breatheOut: createAudioPlayer(breatheOutSource),
        hold: createAudioPlayer(holdSource),
      };
    }
  });
}

export const releaseGuidedBreathingAudio = () => {
  requestedAudioGeneration++;
  return enqueueAudioOperation(disposeCurrentAudio);
};

export const stopGuidedBreathingAudio = () => {
  endingBellSound?.pause();
  currentGuidedBreathingSounds?.breatheIn.pause();
  currentGuidedBreathingSounds?.breatheOut.pause();
  currentGuidedBreathingSounds?.hold.pause();
};

export const playGuidedBreathingSound = async (guidedBreathingStep: GuidedBreathingStep) => {
  const player = currentGuidedBreathingSounds?.[guidedBreathingStep];
  try {
    await player?.seekTo(0);
    if (player === currentGuidedBreathingSounds?.[guidedBreathingStep]) player?.play();
  } catch {
    // Audio cues are optional; keep the visual exercise running if a native player fails.
  }
};

export const playEndingBellSound = async () => {
  const player = endingBellSound;
  try {
    await player?.seekTo(0);
    if (player === endingBellSound) player?.play();
  } catch {
    // Completion must not fail because the optional ending bell could not play.
  }
};
