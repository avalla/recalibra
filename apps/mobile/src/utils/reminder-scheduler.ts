import { tr } from '../i18n/core';
import type { Language } from '../i18n/language';

export interface ReminderSettings { enabled: boolean; time: string; days: number[] }
export interface ScheduledReminder {
  identifier: string;
  content: { title?: string | null; data?: Record<string, unknown> };
}
export interface ReminderRequest {
  identifier: string;
  title: string;
  body: string;
  weekday: number;
  hour: number;
  minute: number;
  language: Language;
}
export interface ReminderPort {
  list(): Promise<ScheduledReminder[]>;
  canSchedule(): Promise<boolean>;
  schedule(request: ReminderRequest): Promise<unknown>;
  cancel(identifier: string): Promise<void>;
}
const PREFIX = 'recalibra-practice-';
const MESSAGES = [
  'Just 2 minutes can change your day.', 'Your calm is waiting for you.',
  'Take a breath, reset your mind.', 'A moment of peace awaits.',
  'Ready to activate your vagus nerve?', 'Your daily dose of calm is here.', 'Breathe in, stress out.',
];
const owns = (request: ScheduledReminder) => request.identifier.startsWith(PREFIX)
  || request.content.data?.kind === 'recalibra-practice'
  // Migration of reminders scheduled by the previous app (random identifiers).
  || request.content.title === 'Time for your practice 🧘';

/** Serialize language/settings changes; read the latest persisted settings on execution. */
export function createReminderSynchronizer(port: ReminderPort, read: () => Promise<{ settings: ReminderSettings; language: Language }>) {
  let tail = Promise.resolve();
  return () => {
    const operation = tail.then(async () => {
      const { settings, language } = await read();
      const scheduled = await port.list();
      if (!settings.enabled) {
        for (const request of scheduled.filter(owns)) await port.cancel(request.identifier);
        return;
      }
      const [hour, minute] = settings.time.split(':').map(Number);
      if (!Number.isInteger(hour) || hour < 0 || hour > 23 || !Number.isInteger(minute) || minute < 0 || minute > 59) throw new Error('Invalid reminder time');
      const days = [...new Set(settings.days)];
      if (days.some(day => !Number.isInteger(day) || day < 0 || day > 6)) throw new Error('Invalid reminder day');
      if (!await port.canSchedule()) return;
      const desired = new Set<string>();
      for (const day of days) {
        const identifier = `${PREFIX}${day}`;
        desired.add(identifier);
        // Reusing an identifier replaces that request. Failed updates leave the old request available for retry.
        await port.schedule({ identifier, language, weekday: day + 1, hour, minute,
          title: tr('Time for your practice 🧘', { lng: language }),
          body: tr(MESSAGES[day], { lng: language }) });
      }
      for (const request of scheduled.filter(owns)) {
        if (!desired.has(request.identifier)) await port.cancel(request.identifier);
      }
    });
    tail = operation.catch(() => {});
    return operation;
  };
}
