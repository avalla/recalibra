import { tr } from '../i18n/core';
import * as Notifications from 'expo-notifications';
import { logger } from './logger';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationSchedule {
  id?: string;
  title: string;
  body: string;
  trigger: Notifications.NotificationTriggerInput;
  data?: Record<string, any>;
}

export class NotificationManager {
  private static instance: NotificationManager;
  private scheduledNotifications: Map<string, string> = new Map();
  
  private constructor() {}
  
  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }
  
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      const isGranted = status === 'granted';
      
      if (isGranted) {
        logger.info('Notification permissions granted', 'NotificationManager');
      } else {
        logger.warn('Notification permissions denied', 'NotificationManager');
      }
      
      return isGranted;
    } catch (error) {
      logger.error('Error requesting notification permissions', error as Error, 'NotificationManager');
      return false;
    }
  }
  
  async scheduleNotification(notification: NotificationSchedule): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
        },
        trigger: notification.trigger,
      });
      
      // Store the notification ID
      if (notification.id) {
        this.scheduledNotifications.set(notification.id, notificationId);
      }
      
      logger.info(`Scheduled notification: ${notificationId}`, 'NotificationManager');
      return notificationId;
    } catch (error) {
      logger.error('Error scheduling notification', error as Error, 'NotificationManager');
      return null;
    }
  }
  
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      logger.info(`Cancelled notification: ${notificationId}`, 'NotificationManager');
    } catch (error) {
      logger.error(`Error cancelling notification: ${notificationId}`, error as Error, 'NotificationManager');
    }
  }
  
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.scheduledNotifications.clear();
      logger.info('Cancelled all notifications', 'NotificationManager');
    } catch (error) {
      logger.error('Error cancelling all notifications', error as Error, 'NotificationManager');
    }
  }
  
  async cancelNotificationsByIds(notificationIds: string[]): Promise<void> {
    try {
      for (const id of notificationIds) {
        await this.cancelNotification(id);
      }
    } catch (error) {
      logger.error('Error cancelling notifications by IDs', error as Error, 'NotificationManager');
    }
  }
  
  async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      logger.info(`Retrieved ${notifications.length} scheduled notifications`, 'NotificationManager');
      return notifications;
    } catch (error) {
      logger.error('Error getting scheduled notifications', error as Error, 'NotificationManager');
      return [];
    }
  }
  
  async presentNotification(title: string, body: string, data?: Record<string, any>): Promise<void> {
    try {
      // Use schedule notification with immediate trigger instead
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
        },
        trigger: null, // Immediate trigger
      });
      logger.info(`Presented notification: ${title}`, 'NotificationManager');
    } catch (error) {
      logger.error('Error presenting notification', error as Error, 'NotificationManager');
    }
  }
  
  getNotificationById(customId: string): string | undefined {
    return this.scheduledNotifications.get(customId);
  }
  
  removeNotificationById(customId: string): boolean {
    return this.scheduledNotifications.delete(customId);
  }
  
  clearNotificationMap(): void {
    this.scheduledNotifications.clear();
  }
  
  // Helper methods for common notification types
  async scheduleDailyReminder(
    title: string,
    body: string,
    hour: number,
    minute: number,
    customId?: string
  ): Promise<string | null> {
    // Using 'any' to avoid TypeScript errors with trigger types
    // This is a workaround for type incompatibility issues
    const trigger: any = {
      hour,
      minute,
      repeats: true,
    };
    
    return this.scheduleNotification({
      id: customId,
      title,
      body,
      trigger,
    });
  }
  
  async scheduleExerciseReminder(
    exerciseName: string,
    minutesFromNow: number,
    customId?: string
  ): Promise<string | null> {
    // Using 'any' to avoid TypeScript errors with trigger types
    // This is a workaround for type incompatibility issues
    const trigger: any = {
      seconds: minutesFromNow * 60,
    };
    
    return this.scheduleNotification({
      id: customId,
      title: tr("Time for your exercise"),
      body: tr("It’s time to practice {{name}}", { name: exerciseName }),
      trigger,
    });
  }
}

export const notificationManager = NotificationManager.getInstance();

// Set up notification listeners
export const setupNotificationListeners = () => {
  // Handle incoming notifications
  const notificationReceivedListener = Notifications.addNotificationReceivedListener(notification => {
    logger.info('Notification received', 'NotificationManager');
  });
  
  // Handle notification responses (taps)
  const notificationResponseListener = Notifications.addNotificationResponseReceivedListener(response => {
    logger.info('Notification response received', 'NotificationManager');
    // Handle notification tap here if needed
  });
  
  return {
    notificationReceivedListener,
    notificationResponseListener,
  };
};

// Clean up notification listeners
export const removeNotificationListeners = (
  notificationReceivedListener: Notifications.Subscription,
  notificationResponseListener: Notifications.Subscription
) => {
  notificationReceivedListener.remove();
  notificationResponseListener.remove();
};
