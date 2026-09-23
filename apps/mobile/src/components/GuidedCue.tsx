import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Colors, FontFamily, FontWeight } from '../constants';

const CUES: Record<string, string> = {
  'eyes-up': '↑',
  'eyes-down': '↓',
  'eyes-left': '←',
  'eyes-right': '→',
  'eyes-left-right': '←  →',
  'eyes-diagonal': '↖  ↘',
  'eyes-diagonal-reverse': '↗  ↙',
  'eyes-circle': '⟳',
  'eyes-circle-reverse': '⟲',
  'eyes-closed': '◌',
  breathing: '◯',
  'breathing-in': '↑',
  'breathing-hold': '•',
  'breathing-out': '↓',
  'breathing-rest': '…',
  ready: '•',
};

const BREATHING_CUES = new Set(['breathing', 'breathing-in', 'breathing-hold', 'breathing-out', 'breathing-rest']);

function breathingTarget(cue: string): number {
  if (cue === 'breathing-in' || cue === 'breathing-hold') return 1;
  if (cue === 'breathing-out' || cue === 'breathing-rest') return 0;
  return 0.5;
}

function BreathingCue({ cue, durationMs, paused }: { cue: string; durationMs?: number; paused: boolean }) {
  const progress = useSharedValue(breathingTarget(cue));

  useEffect(() => {
    cancelAnimation(progress);
    const target = breathingTarget(cue);
    if (paused) return;
    if (cue === 'breathing' || cue === 'breathing-hold' || cue === 'breathing-rest') {
      progress.value = target;
      return;
    }
    progress.value = withTiming(target, {
      duration: Math.max(400, durationMs ?? 4000),
      easing: Easing.inOut(Easing.quad),
    });
    return () => cancelAnimation(progress);
  }, [cue, durationMs, paused, progress]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.72 + progress.value * 0.28 }],
    opacity: 0.78 + progress.value * 0.22,
  }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.84 + progress.value * 0.16 }],
    opacity: 0.18 + progress.value * 0.2,
  }));

  return (
    <View style={styles.breathingVisual}>
      <Animated.View style={[styles.breathingRing, ringStyle]} />
      <Animated.View style={[styles.breathingOrb, orbStyle]}>
        <Text style={styles.breathingSymbol}>{CUES[cue]}</Text>
      </Animated.View>
    </View>
  );
}

export function GuidedCue({
  cue,
  durationMs,
  instruction,
  paused = false,
}: {
  cue?: string;
  durationMs?: number;
  instruction: string;
  paused?: boolean;
}) {
  const resolvedCue = cue ?? '';
  const isBreathing = BREATHING_CUES.has(resolvedCue);

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="image"
      accessibilityLabel={instruction}
    >
      {isBreathing ? (
        <BreathingCue cue={resolvedCue} durationMs={durationMs} paused={paused} />
      ) : (
        <Text style={styles.cue}>{CUES[resolvedCue] ?? '•'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 220,
    height: 220,
    borderRadius: 110,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgroundCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cue: {
    color: Colors.primary,
    fontSize: 78,
    lineHeight: 96,
    fontFamily: FontFamily.heading,
    fontWeight: FontWeight.regular,
    textAlign: 'center',
  },
  breathingVisual: {
    width: 190,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingRing: {
    position: 'absolute',
    width: 174,
    height: 174,
    borderRadius: 87,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  breathingOrb: {
    width: 132,
    height: 132,
    borderRadius: 66,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  breathingSymbol: {
    color: Colors.background,
    fontSize: 48,
    lineHeight: 58,
    fontFamily: FontFamily.heading,
    fontWeight: FontWeight.semibold,
  },
});
