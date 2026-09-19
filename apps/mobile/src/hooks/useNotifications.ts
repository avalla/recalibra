import { tr } from '../i18n/core';
import { useState, useEffect, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { syncReminders } from '../utils/reminders';
import { logger } from '../utils/logger';
import { permissionManager } from '../utils/permissions';
import { getReminders as getRemindersFromDb, setReminders as setRemindersInDb } from '../db';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface ReminderSettings {
  enabled: boolean;
  time: string; // HH:mm format
  days: number[]; // 0-6, Sunday = 0
}

const DEFAULT_REMINDER: ReminderSettings = {
  enabled: false,
  time: '09:00',
  days: [1, 2, 3, 4, 5], // Weekdays
};

export const useNotifications = () => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(DEFAULT_REMINDER);
  const [isLoading, setIsLoading] = useState(true);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  const requestPermissions = useCallback(async () => {
    try {
      // Use our permission manager
      const permissionGranted = await permissionManager.requestNotificationPermissions();
      
      if (!permissionGranted) {
        logger.warn('Notification permissions not granted', 'useNotifications');
        return null;
      }
      
      // These are local reminders; no remote push token or network request is needed.
      await syncReminders();
      return null;
    } catch (error) {
      logger.error('Error requesting notification permissions', error as Error, 'useNotifications');
      return null;
    }
  }, []);

  // Load reminder settings from local storage
  const loadSettings = useCallback(async () => {
    try {
      const data = await getRemindersFromDb();
      setReminderSettings(data);
    } catch (err) {
      logger.info('No settings found, using defaults', 'useNotifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save reminder settings to local storage
  const saveSettings = async (settings: Partial<ReminderSettings>) => {
    const newSettings = { ...reminderSettings, ...settings };
    setReminderSettings(newSettings);

    try {
      await setRemindersInDb(newSettings);

      // Reschedule notifications
      await syncReminders();
    } catch (err) {
      logger.error('Error saving settings', err as Error, 'useNotifications');
    }
  };

  // The DB remains the single source of truth for both settings and language changes.
  const scheduleReminders = syncReminders;

  // Send immediate test notification
  const sendTestNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: tr("Recalibra 🧘"),
        body: tr("Your reminders are working!"),
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2 },
    });
  };

  // Initialize
  useEffect(() => {
    requestPermissions().then(setExpoPushToken);
    loadSettings();

    // Listen for incoming notifications
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      logger.debug('Notification received', 'useNotifications');
    });

    // Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener(() => {
      logger.debug('Notification response received', 'useNotifications');
      // Could navigate to specific screen here
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [loadSettings]);

  return {
    expoPushToken,
    reminderSettings,
    isLoading,
    saveSettings,
    sendTestNotification,
    scheduleReminders,
  };
};
