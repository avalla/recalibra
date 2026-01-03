import React, { useEffect, useMemo } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import type { Exercise, ExerciseCategory, ExerciseObjective } from '@/types';

export interface ExerciseIllustrationProps {
  exercise: Pick<Exercise, 'category' | 'objective' | 'breathing_pattern'>;
  variant: 'card' | 'hero';
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

type Palette = {
  bgStart: string;
  bgEnd: string;
  accent: string;
  accent2: string;
};

function getPalette(input: {
  category: ExerciseCategory;
  objective: ExerciseObjective;
}): Palette {
  const byCategory: Record<ExerciseCategory, Palette> = {
    breathing: {
      bgStart: '#1B3A33',
      bgEnd: '#0F1A19',
      accent: '#4ECDC4',
      accent2: '#2DD4BF',
    },
    water: {
      bgStart: '#15324A',
      bgEnd: '#0F1A19',
      accent: '#45B7D1',
      accent2: '#60A5FA',
    },
    movement: {
      bgStart: '#183B2A',
      bgEnd: '#0F1A19',
      accent: '#96CEB4',
      accent2: '#22C55E',
    },
    sensory: {
      bgStart: '#2A1D3A',
      bgEnd: '#0F1A19',
      accent: '#DDA0DD',
      accent2: '#A78BFA',
    },
  };

  const base = byCategory[input.category];
  if (input.objective === 'energy') {
    return { ...base, accent2: '#F59E0B' };
  }

  if (input.objective === 'sleep') {
    return { ...base, accent2: '#A78BFA' };
  }

  if (input.objective === 'focus') {
    return { ...base, accent2: '#60A5FA' };
  }

  return base;
}

function getIntensityFromBreathingPattern(pattern: ExerciseIllustrationProps['exercise']['breathing_pattern']): number {
  const special = pattern?.special;
  if (!special) return 1;
  if (special === 'wim_hof' || special === 'rapid' || special === 'holotropic') return 1.35;
  if (special === 'double_inhale' || special === 'rapid_exhale') return 1.2;
  if (special === 'humming') return 0.85;
  return 1;
}

function clampMs(valueMs: number, minMs: number, maxMs: number): number {
  return Math.max(minMs, Math.min(maxMs, valueMs));
}

function toMs(seconds: number | undefined): number {
  if (!seconds || !Number.isFinite(seconds)) return 0;
  return Math.max(0, Math.round(seconds * 1000));
}

function buildBreathingScaleAnimation(input: {
  pattern: ExerciseIllustrationProps['exercise']['breathing_pattern'];
  baseScale: number;
  maxScale: number;
}) {
  const inhaleMs = clampMs(toMs(input.pattern?.inhale), 600, 12000);
  const holdMs = clampMs(toMs(input.pattern?.hold), 0, 12000);
  const exhaleMs = clampMs(toMs(input.pattern?.exhale), 600, 12000);
  const restMs = clampMs(toMs(input.pattern?.rest), 0, 12000);

  const special = input.pattern?.special;
  const ease = Easing.inOut(Easing.quad);

  if (special === 'double_inhale') {
    const inhale1 = Math.max(220, Math.round(inhaleMs * 0.38));
    const inhale2 = Math.max(220, inhaleMs - inhale1);
    const midScale = input.baseScale + (input.maxScale - input.baseScale) * 0.62;
    return withSequence(
      withTiming(midScale, { duration: inhale1, easing: ease }),
      withTiming(input.maxScale, { duration: inhale2, easing: ease }),
      withTiming(input.maxScale, { duration: holdMs, easing: ease }),
      withTiming(input.baseScale, { duration: exhaleMs, easing: ease }),
      withTiming(input.baseScale, { duration: restMs, easing: ease })
    );
  }

  return withSequence(
    withTiming(input.maxScale, { duration: inhaleMs, easing: ease }),
    withTiming(input.maxScale, { duration: holdMs, easing: ease }),
    withTiming(input.baseScale, { duration: exhaleMs, easing: ease }),
    withTiming(input.baseScale, { duration: restMs, easing: ease })
  );
}

export function ExerciseIllustration({
  exercise,
  variant,
  animated = false,
  style,
}: ExerciseIllustrationProps): React.ReactElement {
  const palette = useMemo(
    () =>
      getPalette({
        category: exercise.category,
        objective: exercise.objective,
      }),
    [exercise.category, exercise.objective]
  );

  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!animated) {
      pulse.value = 1;
      return;
    }

    const isBreathingTimeline =
      exercise.category === 'breathing' &&
      variant === 'hero' &&
      !!exercise.breathing_pattern &&
      (exercise.breathing_pattern.inhale > 0 || exercise.breathing_pattern.exhale > 0);

    if (isBreathingTimeline) {
      const intensity = getIntensityFromBreathingPattern(exercise.breathing_pattern);
      const amplitude = 0.06 * intensity;
      const baseScale = 1;
      const maxScale = clampMs(Math.round((baseScale + amplitude) * 1000), 1020, 1120) / 1000;

      pulse.value = withRepeat(
        buildBreathingScaleAnimation({
          pattern: exercise.breathing_pattern,
          baseScale,
          maxScale,
        }),
        -1,
        false
      );
      return;
    }

    const baseDuration = variant === 'hero' ? 2400 : 3200;
    const intensity = getIntensityFromBreathingPattern(exercise.breathing_pattern);
    const duration = Math.max(1400, Math.round(baseDuration / intensity));

    pulse.value = withRepeat(
      withTiming(1.04, {
        duration,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true
    );
  }, [animated, exercise.breathing_pattern, exercise.category, pulse, variant]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulse.value }],
    };
  }, []);

  const primary = palette.accent;
  const secondary = palette.accent2;

  return (
    <Animated.View style={[animated ? animatedStyle : null, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={palette.bgStart} />
            <Stop offset="1" stopColor={palette.bgEnd} />
          </LinearGradient>
          <LinearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={primary} stopOpacity={0.9} />
            <Stop offset="1" stopColor={secondary} stopOpacity={0.9} />
          </LinearGradient>
        </Defs>

        <Path d="M0 0H100V100H0Z" fill="url(#bg)" />

        {exercise.category === 'water' ? (
          <>
            <Path
              d="M0 62 C 18 56, 32 70, 50 62 C 68 54, 82 70, 100 62 V100 H0 Z"
              fill={primary}
              opacity={0.22}
            />
            <Path
              d="M0 72 C 20 66, 30 82, 52 74 C 74 66, 82 82, 100 74 V100 H0 Z"
              fill={secondary}
              opacity={0.18}
            />
            <Circle cx={28} cy={36} r={3.2} fill={secondary} opacity={0.16} />
            <Circle cx={68} cy={30} r={2.4} fill={primary} opacity={0.14} />
          </>
        ) : null}

        {exercise.category === 'movement' ? (
          <>
            <Path
              d="M14 70 C 30 40, 56 40, 86 18"
              stroke={secondary}
              strokeWidth={3}
              strokeLinecap="round"
              opacity={0.24}
              fill="none"
            />
            <Path
              d="M16 82 C 32 52, 58 52, 90 28"
              stroke={primary}
              strokeWidth={3}
              strokeLinecap="round"
              opacity={0.20}
              fill="none"
            />
          </>
        ) : null}

        {exercise.category === 'sensory' ? (
          <>
            <Circle cx={32} cy={40} r={18} fill={primary} opacity={0.12} />
            <Circle cx={70} cy={58} r={22} fill={secondary} opacity={0.10} />
          </>
        ) : null}

        {exercise.category === 'breathing' ? (
          <>
            <Circle cx={50} cy={50} r={24} fill={primary} opacity={0.12} />
            <Circle cx={50} cy={50} r={32} stroke="url(#ring)" strokeWidth={3} opacity={0.55} fill="none" />
            <Circle cx={50} cy={50} r={14} fill={secondary} opacity={0.18} />
          </>
        ) : null}

        {variant === 'hero' ? (
          <Circle cx={50} cy={50} r={40} stroke={primary} strokeWidth={1} opacity={0.14} fill="none" />
        ) : null}
      </Svg>
    </Animated.View>
  );
}
