import { useState, useEffect, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
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
      
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: '61c87648-19f0-4e46-ae78-ea29d91e9841',
      });
      
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('reminders', {
          name: 'Daily Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#4ECDC4',
        });
      }
      
      return token.data;
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
      console.log('[Notifications] No settings found, using defaults');
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
      await scheduleReminders(newSettings);
    } catch (err) {
      console.error('[Notifications] Error saving settings:', err);
    }
  };

  // Schedule daily reminders
  const scheduleReminders = async (settings: ReminderSettings) => {
    // Cancel all existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!settings.enabled) return;

    const [hours = 0, minutes = 0] = settings.time.split(':').map(Number);

    // Schedule for each selected day
    for (const day of settings.days) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Time for your practice 🧘',
          body: getRandomMotivation(),
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: day + 1, // Expo uses 1-7, Sunday = 1
          hour: hours,
          minute: minutes,
        },
      });
    }

    console.log('[Notifications] Scheduled reminders for days:', settings.days);
  };

  // Random motivational messages
  const getRandomMotivation = () => {
    const messages = [
      'Just 2 minutes can change your day.',
      'Your calm is waiting for you.',
      'Take a breath, reset your mind.',
      'A moment of peace awaits.',
      'Ready to activate your vagus nerve?',
      'Your daily dose of calm is here.',
      'Breathe in, stress out.',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Send immediate test notification
  const sendTestNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Recalibra 🧘',
        body: 'Your reminders are working!',
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
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('[Notifications] Received:', notification);
    });

    // Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('[Notifications] Response:', response);
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
