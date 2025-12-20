import { useCallback, useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HAPTICS_ENABLED_KEY = '@recalibra:haptics_enabled';

export const useHaptics = () => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load setting from storage
  useEffect(() => {
    const loadSetting = async () => {
      try {
        const value = await AsyncStorage.getItem(HAPTICS_ENABLED_KEY);
        if (value !== null) {
          setIsEnabled(value === 'true');
        }
      } catch (e) {
        console.log('[useHaptics] Error loading setting:', e);
      }
      setIsLoaded(true);
    };
    loadSetting();
  }, []);

  // Save setting
  const setEnabled = useCallback(async (enabled: boolean) => {
    setIsEnabled(enabled);
    try {
      await AsyncStorage.setItem(HAPTICS_ENABLED_KEY, enabled ? 'true' : 'false');
    } catch (e) {
      console.log('[useHaptics] Error saving setting:', e);
    }
  }, []);

  // Light haptic - for UI interactions
  const light = useCallback(async () => {
    if (!isEnabled) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      console.log('[useHaptics] Light haptic error:', e);
    }
  }, [isEnabled]);

  // Medium haptic - for selections, toggles
  const medium = useCallback(async () => {
    if (!isEnabled) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      console.log('[useHaptics] Medium haptic error:', e);
    }
  }, [isEnabled]);

  // Heavy haptic - for important events
  const heavy = useCallback(async () => {
    if (!isEnabled) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {
      console.log('[useHaptics] Heavy haptic error:', e);
    }
  }, [isEnabled]);

  // Selection haptic - for picker/selection changes
  const selection = useCallback(async () => {
    if (!isEnabled) return;
    try {
      await Haptics.selectionAsync();
    } catch (e) {
      console.log('[useHaptics] Selection haptic error:', e);
    }
  }, [isEnabled]);

  // Success haptic - for successful actions
  const success = useCallback(async () => {
    if (!isEnabled) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.log('[useHaptics] Success haptic error:', e);
    }
  }, [isEnabled]);

  // Warning haptic
  const warning = useCallback(async () => {
    if (!isEnabled) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {
      console.log('[useHaptics] Warning haptic error:', e);
    }
  }, [isEnabled]);

  // Error haptic
  const error = useCallback(async () => {
    if (!isEnabled) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (e) {
      console.log('[useHaptics] Error haptic error:', e);
    }
  }, [isEnabled]);

  // Breathing phase haptic - gentle pulse for phase transitions
  const breathingPhase = useCallback(async () => {
    if (!isEnabled) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    } catch (e) {
      console.log('[useHaptics] Breathing haptic error:', e);
    }
  }, [isEnabled]);

  return {
    isEnabled,
    isLoaded,
    setEnabled,
    // Haptic functions
    light,
    medium,
    heavy,
    selection,
    success,
    warning,
    error,
    breathingPhase,
  };
};
