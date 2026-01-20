import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { handleError, createError } from '../utils/errorHandler';
import { logger } from '../utils/logger';

// Safely import react-native-health - may not be available on all devices/simulators
let AppleHealthKit: any = null;
try {
  AppleHealthKit = require('react-native-health').default;
} catch (e) {
  logger.warn('react-native-health not available', 'AppleHealth');
}

type HealthKitPermissions = any;
type HealthValue = any;
type HealthInputOptions = any;

// Types
export interface HRVData {
  value: number;
  startDate: string;
  endDate: string;
}

export interface HeartRateData {
  value: number;
  startDate: string;
  endDate: string;
}

export interface MindfulSessionData {
  startDate: Date;
  endDate: Date;
}

// Permissions we need - defined only if AppleHealthKit is available
const getHealthKitPermissions = (): HealthKitPermissions | null => {
  if (!AppleHealthKit?.Constants?.Permissions) {
    return null;
  }
  return {
    permissions: {
      read: [
        AppleHealthKit.Constants.Permissions.HeartRate,
        AppleHealthKit.Constants.Permissions.HeartRateVariability,
        AppleHealthKit.Constants.Permissions.RespiratoryRate,
        AppleHealthKit.Constants.Permissions.MindfulSession,
      ],
      write: [
        AppleHealthKit.Constants.Permissions.MindfulSession,
      ],
    },
  };
};

export const useAppleHealth = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if HealthKit is available (iOS only)
  useEffect(() => {
    if (Platform.OS !== 'ios' || !AppleHealthKit) {
      setIsAvailable(false);
      setIsLoading(false);
      return;
    }

    try {
      AppleHealthKit.isAvailable((err: any, available: any) => {
        if (err) {
          logger.error('Error checking availability', err, 'AppleHealth');
          setError('HealthKit not available');
          setIsAvailable(false);
        } else {
          logger.info(`HealthKit is ${available ? 'available' : 'not available'}`, 'AppleHealth');
          setIsAvailable(available);
          setError(null); // Reset error when available
        }
        setIsLoading(false);
      });
    } catch (e) {
      logger.error('HealthKit check failed', e as Error, 'AppleHealth');
      setError('HealthKit initialization failed');
      setIsAvailable(false);
      setIsLoading(false);
    }
  }, []);

  // Request authorization
  const requestAuthorization = useCallback(async (): Promise<boolean> => {
    if (!isAvailable || !AppleHealthKit) {
      const error = createError('HealthKit not available', 'HEALTHKIT_NOT_AVAILABLE', 'warning');
      handleError(error, 'requestAuthorization');
      logger.warn('HealthKit not available', 'AppleHealth');
      return false;
    }

    const permissions = getHealthKitPermissions();
    if (!permissions) {
      const error = createError('Could not get permissions', 'PERMISSIONS_NOT_AVAILABLE', 'warning');
      handleError(error, 'requestAuthorization');
      logger.warn('Could not get permissions', 'AppleHealth');
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      AppleHealthKit.initHealthKit(permissions, (err: any) => {
        if (err) {
          const error = createError(
            `Error requesting authorization: ${err.message || err}`,
            'AUTHORIZATION_FAILED',
            'error'
          );
          handleError(error, 'requestAuthorization');
          setError('Authorization failed');
          setIsAuthorized(false);
          logger.error('Error requesting authorization', err, 'AppleHealth');
          resolve(false);
        } else {
          logger.info('Authorization granted', 'AppleHealth');
          setIsAuthorized(true);
          setError(null);
          resolve(true);
        }
      });
    });
  }, [isAvailable]);

  // Save a mindful session to HealthKit
  const saveMindfulSession = useCallback(async (
    startDate: Date,
    endDate: Date
  ): Promise<boolean> => {
    if (!isAvailable || !isAuthorized || !AppleHealthKit) {
      logger.warn('Cannot save: not available or not authorized', 'AppleHealth');
      return false;
    }

    const options: any = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    return new Promise((resolve) => {
      AppleHealthKit.saveMindfulSession(options, (err: any, result: any) => {
        if (err) {
          logger.error('Error saving mindful session', err, 'AppleHealth');
          resolve(false);
        } else {
          logger.info('Mindful session saved', 'AppleHealth');
          resolve(true);
        }
      });
    });
  }, [isAvailable, isAuthorized]);

  // Get HRV data
  const getHRVData = useCallback(async (
    startDate: Date,
    endDate: Date = new Date()
  ): Promise<HRVData[]> => {
    if (!isAvailable || !isAuthorized || !AppleHealthKit) {
      return [];
    }

    const options: HealthInputOptions = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      ascending: false,
      limit: 100,
    };

    return new Promise((resolve) => {
      AppleHealthKit.getHeartRateVariabilitySamples(options, (err: any, results: any) => {
        if (err) {
          logger.warn('Error getting HRV', 'AppleHealth');
          resolve([]);
        } else {
          const data: HRVData[] = (results || []).map((sample: HealthValue) => ({
            value: sample.value,
            startDate: sample.startDate,
            endDate: sample.endDate,
          }));
          resolve(data);
        }
      });
    });
  }, [isAvailable, isAuthorized]);

  // Get heart rate data
  const getHeartRateData = useCallback(async (
    startDate: Date,
    endDate: Date = new Date()
  ): Promise<HeartRateData[]> => {
    if (!isAvailable || !isAuthorized || !AppleHealthKit) {
      return [];
    }

    const options: HealthInputOptions = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      ascending: false,
      limit: 100,
    };

    return new Promise((resolve) => {
      AppleHealthKit.getHeartRateSamples(options, (err: any, results: any) => {
        if (err) {
          logger.warn('Error getting heart rate', 'AppleHealth');
          resolve([]);
        } else {
          const data: HeartRateData[] = (results || []).map((sample: HealthValue) => ({
            value: sample.value,
            startDate: sample.startDate,
            endDate: sample.endDate,
          }));
          resolve(data);
        }
      });
    });
  }, [isAvailable, isAuthorized]);

  // Get mindful sessions (to show history)
  const getMindfulSessions = useCallback(async (
    startDate: Date,
    endDate: Date = new Date()
  ): Promise<MindfulSessionData[]> => {
    if (!isAvailable || !isAuthorized || !AppleHealthKit) {
      return [];
    }

    const options: HealthInputOptions = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      ascending: false,
    };

    return new Promise((resolve) => {
      AppleHealthKit.getMindfulSession(options, (err: any, results: any) => {
        if (err) {
          logger.warn('Error getting mindful sessions', 'AppleHealth');
          resolve([]);
        } else {
          const data: MindfulSessionData[] = (results || []).map((sample: any) => ({
            startDate: new Date(sample.startDate),
            endDate: new Date(sample.endDate),
          }));
          resolve(data);
        }
      });
    });
  }, [isAvailable, isAuthorized]);

  // Get average HRV for a period
  const getAverageHRV = useCallback(async (days: number = 7): Promise<number | null> => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const data = await getHRVData(startDate);
    
    if (data.length === 0) return null;
    
    const sum = data.reduce((acc, item) => acc + item.value, 0);
    return Math.round(sum / data.length);
  }, [getHRVData]);

  // Get latest HRV
  const getLatestHRV = useCallback(async (): Promise<number | null> => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    
    const data = await getHRVData(startDate);
    
    if (data.length === 0) return null;

    const first = data[0];
    if (!first) return null;
    return Math.round(first.value);
  }, [getHRVData]);

  return {
    // State
    isAvailable,
    isAuthorized,
    isLoading,
    error,
    
    // Actions
    requestAuthorization,
    saveMindfulSession,
    
    // Data fetching
    getHRVData,
    getHeartRateData,
    getMindfulSessions,
    getAverageHRV,
    getLatestHRV,
  };
};
