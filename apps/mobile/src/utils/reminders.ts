import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getReminders } from '../db/settings';
import { currentLanguage, tr } from '../i18n/core';
import { createReminderSynchronizer } from './reminder-scheduler';

export const syncReminders = createReminderSynchronizer({
  list: Notifications.getAllScheduledNotificationsAsync,
  cancel: Notifications.cancelScheduledNotificationAsync,
  canSchedule: async () => {
    const permission = await Notifications.getPermissionsAsync();
    return permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  },
  schedule: async request => {
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('reminders', {
      name: tr('Daily Reminders', { lng: request.language }),
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250], lightColor: '#4ECDC4',
    });
    return Notifications.scheduleNotificationAsync({
      identifier: request.identifier,
      content: { title: request.title, body: request.body, sound: true, data: { kind: 'recalibra-practice' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: request.weekday, hour: request.hour, minute: request.minute, channelId: 'reminders' },
    });
  },
}, async () => ({ settings: await getReminders(), language: currentLanguage() }));
