import { useEffect } from 'react';

import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export function useHomeAnimations() {
  const breatheScale = useSharedValue(1);
  const fadeValue = useSharedValue(0);

  useEffect(() => {
    breatheScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    fadeValue.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
  }, []);

  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: breatheScale.value }],
    };
  });

  const fadeStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeValue.value,
    };
  });

  return {
    animatedButtonStyle,
    fadeStyle,
  };
}
