import { Platform } from 'react-native';
import * as Application from 'expo-application';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_UUID_KEY = '@recalibra:device_uuid';

/**
 * Get or generate a unique device identifier
 */
export const getDeviceUUID = async (): Promise<string> => {
  try {
    // First check if we already have a UUID stored
    const storedUUID = await AsyncStorage.getItem(DEVICE_UUID_KEY);
    if (storedUUID) {
      return storedUUID;
    }

    // Generate new UUID based on platform
    let uuid: string;
    
    if (Platform.OS === 'ios') {
      // Use application identifier on iOS
      uuid = await Application.getIosIdForVendorAsync() || await generateFallbackUUID();
    } else if (Platform.OS === 'android') {
      // Use Android ID on Android
      uuid = Application.getAndroidId() || await generateFallbackUUID();
    } else {
      // Fallback for web or other platforms
      uuid = await generateFallbackUUID();
    }

    // Store the UUID for future use
    await AsyncStorage.setItem(DEVICE_UUID_KEY, uuid);
    
    return uuid;
  } catch (error) {
    console.error('[Device] Error getting UUID:', error);
    // Final fallback
    return generateFallbackUUID();
  }
};

/**
 * Generate a fallback UUID using crypto API
 */
const generateFallbackUUID = async (): Promise<string> => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for older environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Check if this is the first time the app is launched on this device
 */
export const isFirstLaunch = async (): Promise<boolean> => {
  const hasLaunched = await AsyncStorage.getItem('@recalibra:has_launched');
  if (!hasLaunched) {
    await AsyncStorage.setItem('@recalibra:has_launched', 'true');
    return true;
  }
  return false;
};

/**
 * Get device info for analytics
 */
export const getDeviceInfo = () => {
  return {
    platform: Platform.OS,
    version: Platform.Version,
    isTV: Platform.isTV,
  };
};
