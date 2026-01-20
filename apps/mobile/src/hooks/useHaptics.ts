import { useCallback, useEffect, useState } from 'react';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

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
        logger.warn('Error loading setting', 'useHaptics');
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
      logger.warn('Error saving setting', 'useHaptics');
    }
  }, []);

  // Light haptic - for UI interactions
  const light = useCallback(async () => {
    if (!isEnabled) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      logger.debug('Light haptic error', 'useHaptics');
    }
  }, [isEnabled]);

  // Medium haptic - for selections, toggles
  const medium = useCallback(async () => {
    if (!isEnabled) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      logger.debug('Medium haptic error', 'useHaptics');
    }
  }, [isEnabled]);

  // Heavy haptic - for important events
  const heavy = useCallback(async () => {
    if (!isEnabled) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {
      logger.debug('Heavy haptic error', 'useHaptics');
    }
  }, [isEnabled]);

  // Selection haptic - for picker/selection changes
  const selection = useCallback(async () => {
    if (!isEnabled) return;
    try {
      await Haptics.selectionAsync();
    } catch (e) {
      logger.debug('Selection haptic error', 'useHaptics');
    }
  }, [isEnabled]);

  // Success haptic - for successful actions
  const success = useCallback(async () => {
    if (!isEnabled) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      logger.debug('Success haptic error', 'useHaptics');
    }
  }, [isEnabled]);

  // Warning haptic
  const warning = useCallback(async () => {
    if (!isEnabled) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {
      logger.debug('Warning haptic error', 'useHaptics');
    }
  }, [isEnabled]);

  // Error haptic
  const error = useCallback(async () => {
    if (!isEnabled) return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (e) {
      logger.debug('Error haptic error', 'useHaptics');
    }
  }, [isEnabled]);

  // Breathing phase haptic - gentle pulse for phase transitions
  const breathingPhase = useCallback(async () => {
    if (!isEnabled) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    } catch (e) {
      logger.debug('Breathing haptic error', 'useHaptics');
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
