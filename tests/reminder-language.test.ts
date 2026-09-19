import { expect, test } from 'bun:test';
import { createReminderSynchronizer, type ReminderRequest, type ScheduledReminder } from '../apps/mobile/src/utils/reminder-scheduler';
import type { Language } from '../apps/mobile/src/i18n/language';

function fixture() {
  let language: Language = 'en', allowed = true, fail = false, enabled = true;
  let days = [1, 3, 5];
  const active = new Map<string, ScheduledReminder & { request?: ReminderRequest }>([
    ['legacy', { identifier: 'legacy', content: { title: 'Time for your practice 🧘' } }],
    ['unrelated', { identifier: 'unrelated', content: { title: 'Something else' } }],
  ]);
  const requests: ReminderRequest[] = [];
  const sync = createReminderSynchronizer({
    list: async () => [...active.values()],
    canSchedule: async () => allowed,
    cancel: async id => { active.delete(id); },
    schedule: async request => {
      await Promise.resolve();
      if (fail) throw Error('scheduler unavailable');
      requests.push(request);
      active.set(request.identifier, { identifier: request.identifier, content: { title: request.title, data: { kind: 'recalibra-practice' } }, request });
    },
  }, async () => ({ language, settings: { enabled, time: '18:35', days } }));
  return { sync, active, requests, setLanguage: (value: Language) => { language = value; }, setAllowed: (v: boolean) => { allowed = v; }, setFail: (v: boolean) => { fail = v; }, disable: () => { enabled = false; }, setDays: (v: number[]) => { days = v; } };
}

test('language replaces own reminders with identical weekdays and times, migrating old IDs without duplicates', async () => {
  const f = fixture(); await f.sync();
  const before = f.requests.map(({ identifier, weekday, hour, minute }) => ({ identifier, weekday, hour, minute }));
  f.setLanguage('it'); await f.sync();
  expect(f.requests.slice(3).map(({ identifier, weekday, hour, minute }) => ({ identifier, weekday, hour, minute }))).toEqual(before);
  expect(f.requests.slice(3).every(r => r.title === 'È ora della tua pratica 🧘')).toBeTrue();
  expect(f.active.has('legacy')).toBeFalse(); expect(f.active.has('unrelated')).toBeTrue();
  expect(f.active.size).toBe(4);
  expect(before.map(r => r.weekday)).toEqual([2, 4, 6]);
  expect(before.every(r => r.hour === 18 && r.minute === 35)).toBeTrue();
});

test('rapid changes and duplicate days converge to one request per day', async () => {
  const f = fixture(); f.setDays([1, 1, 5]);
  const pending = f.sync(); f.setLanguage('it'); await Promise.all([pending, f.sync(), f.sync()]);
  expect(f.active.size).toBe(3);
  expect([...f.active.values()].filter(r => r.request).every(r => r.request?.language === 'it')).toBeTrue();
  f.setDays([0]); await f.sync();
  expect(f.active.size).toBe(2); expect(f.requests.at(-1)?.weekday).toBe(1);
});

test('failure leaves existing reminders and the queue can retry; disabled settings cancel only own requests', async () => {
  const f = fixture(); f.setFail(true); await expect(f.sync()).rejects.toThrow('scheduler unavailable');
  expect(f.active.has('legacy')).toBeTrue();
  f.setFail(false); await f.sync(); f.disable(); await f.sync();
  expect([...f.active.keys()]).toEqual(['unrelated']);
});

test('unavailable permissions do not prompt or remove existing notifications; a later sync retries', async () => {
  const f = fixture(); f.setAllowed(false); await f.sync(); expect(f.requests).toHaveLength(0);
  expect(f.active.has('legacy')).toBeTrue(); f.setLanguage('it'); f.setAllowed(true); await f.sync();
  expect(f.requests[0]?.language).toBe('it');
});
