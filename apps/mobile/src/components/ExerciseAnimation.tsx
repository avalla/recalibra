import React, { useEffect, useState } from 'react';
import { View, StyleSheet, AccessibilityInfo, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import type { Exercise, ExerciseCategory, ExerciseObjective } from '@/types';
import { Colors } from '../constants';
import { ExerciseIllustration } from './ExerciseIllustration';
import { getExerciseLottie } from './exercise-animations';

/**
 * Uniform exercise demonstration. Resolves, in order:
 *   1. a bespoke Lottie for the slug (when assets + lottie-react-native exist),
 *   2. a calm, category-based motion rendered in code (no assets needed),
 *   3. the static ExerciseIllustration.
 * Honors reduce-motion and pauses with the session.
 */

type CategoryKey = ExerciseCategory | 'default';

interface CategoryStyle {
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
  motion: 'ripple' | 'sway';
  rings: number;
}

const CATEGORY: Record<CategoryKey, CategoryStyle> = {
  breathing: { icon: 'leaf-outline', accent: '#2DD4BF', motion: 'ripple', rings: 2 },
  water: { icon: 'water-outline', accent: '#45B7D1', motion: 'ripple', rings: 3 },
  sensory: { icon: 'sparkles-outline', accent: '#A78BFA', motion: 'ripple', rings: 3 },
  movement: { icon: 'body-outline', accent: '#34D399', motion: 'sway', rings: 1 },
  default: { icon: 'pulse-outline', accent: Colors.primary, motion: 'ripple', rings: 2 },
};

function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (active) setReduce(!!v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => setReduce(!!v));
    return () => {
      active = false;
      sub?.remove?.();
    };
  }, []);
  return reduce;
}

// lottie-react-native is an optional native dependency, present only after
// `expo install lottie-react-native` + a native rebuild. Resolve it lazily so
// the app runs fine without it (the registry is empty until assets are added).
let lottieModule: React.ComponentType<any> | null | undefined;
function getLottieView(): React.ComponentType<any> | null {
  if (lottieModule !== undefined) return lottieModule;
  try {
    const mod = require('lottie-react-native');
    lottieModule = mod.default ?? mod;
  } catch {
    lottieModule = null;
  }
  return lottieModule ?? null;
}

const Ring: React.FC<{
  progress: SharedValue<number>;
  index: number;
  total: number;
  size: number;
  accent: string;
}> = ({ progress, index, total, size, accent }) => {
  const ringSize = size * 0.62;
  const style = useAnimatedStyle(() => {
    const phase = (progress.value + index / total) % 1;
    return {
      transform: [{ scale: 0.45 + phase * 0.8 }],
      opacity: (1 - phase) * 0.5,
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: ringSize,
          height: ringSize,
          borderRadius: ringSize / 2,
          borderWidth: 2,
          borderColor: accent,
        },
        style,
      ]}
    />
  );
};

const CategoryMotion: React.FC<{
  category: CategoryKey;
  size: number;
  paused: boolean;
  reduce: boolean;
}> = ({ category, size, paused, reduce }) => {
  const cfg = CATEGORY[category] ?? CATEGORY.default;
  const progress = useSharedValue(0);
  const sway = useSharedValue(0.5);

  useEffect(() => {
    if (reduce || paused) {
      cancelAnimation(progress);
      cancelAnimation(sway);
      return;
    }
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.out(Easing.quad) }),
      -1,
      false
    );
    sway.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
    return () => {
      cancelAnimation(progress);
      cancelAnimation(sway);
    };
  }, [paused, reduce, progress, sway]);

  const iconChip = size * 0.34;
  const swayStyle = useAnimatedStyle(() => {
    if (cfg.motion !== 'sway') return {};
    return { transform: [{ translateY: (sway.value - 0.5) * size * 0.13 }] };
  });

  return (
    <View style={[styles.motionWrap, { width: size, height: size }]}>
      {cfg.motion === 'ripple' && !reduce
        ? Array.from({ length: cfg.rings }).map((_, i) => (
            <Ring key={i} progress={progress} index={i} total={cfg.rings} size={size} accent={cfg.accent} />
          ))
        : null}
      <View
        style={[
          styles.baseRing,
          {
            width: size * 0.6,
            height: size * 0.6,
            borderRadius: size * 0.3,
            borderColor: cfg.accent + '33',
          },
        ]}
      />
      <Animated.View
        style={[
          styles.iconChip,
          {
            width: iconChip,
            height: iconChip,
            borderRadius: iconChip / 2,
            backgroundColor: cfg.accent + '1F',
            borderColor: cfg.accent + '55',
          },
          swayStyle,
        ]}
      >
        <Ionicons name={cfg.icon} size={iconChip * 0.5} color={cfg.accent} />
      </Animated.View>
    </View>
  );
};

export interface ExerciseAnimationProps {
  exercise: {
    slug?: string;
    category: ExerciseCategory;
    objective?: ExerciseObjective;
    breathing_pattern?: Exercise['breathing_pattern'];
  };
  size: number;
  /** Freeze the animation (e.g. when the session is paused). */
  paused?: boolean;
  loop?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const ExerciseAnimation: React.FC<ExerciseAnimationProps> = ({
  exercise,
  size,
  paused = false,
  loop = true,
  style,
}) => {
  const reduce = useReduceMotion();
  const lottieSource = getExerciseLottie(exercise.slug);

  const illustration = (
    <ExerciseIllustration
      exercise={{
        category: exercise.category,
        objective: exercise.objective ?? 'relax',
        breathing_pattern: exercise.breathing_pattern,
      }}
      variant="hero"
      style={{ width: size, height: size }}
    />
  );

  if (lottieSource) {
    const LottieView = getLottieView();
    if (LottieView) {
      return (
        <View style={[styles.container, { width: size, height: size }, style]}>
          <LottieView
            source={lottieSource}
            autoPlay={!paused && !reduce}
            loop={loop}
            speed={paused || reduce ? 0 : 1}
            style={{ width: size, height: size }}
          />
        </View>
      );
    }
    // Mapped but the native module isn't built in yet: show the illustration.
    return <View style={[styles.container, { width: size, height: size }, style]}>{illustration}</View>;
  }

  const category = exercise.category as CategoryKey;
  if (!CATEGORY[category]) {
    return <View style={[styles.container, { width: size, height: size }, style]}>{illustration}</View>;
  }

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <CategoryMotion category={category} size={size} paused={paused} reduce={reduce} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  motionWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseRing: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  iconChip: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
