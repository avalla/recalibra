// Run separately: bun test ./tests/native/i18n-mounted.check.tsx (native-module mocks are process-local).
import { expect, mock, test } from 'bun:test';
import React, { useState } from '../../apps/mobile/node_modules/react';
import { act, create, type ReactTestRenderer } from '../../apps/mobile/node_modules/react-test-renderer';
import { i18n, tr } from '../../apps/mobile/src/i18n/core';
import { createPracticeClock } from '../../apps/mobile/src/utils/practice-timing';
import { localizedExerciseName } from '../../apps/mobile/src/i18n/exercises';
import { seedExercises } from '../../apps/mobile/src/data/exercises';
let syncs = 0, preference = 'system';
const listeners = new Set<(state: string) => void>();
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
(globalThis as any).__DEV__ = false;
mock.module('../../apps/mobile/node_modules/react-native', () => ({
  AppState: { addEventListener: (_event: string, listener: (state: string) => void) => { listeners.add(listener); return { remove: () => listeners.delete(listener) }; } },
}));
mock.module('../../apps/mobile/src/utils/reminders', () => ({ syncReminders: async () => { syncs++; } }));
mock.module('../../apps/mobile/src/i18n/runtime', () => ({
  languagePreference: () => preference,
  changeLanguagePreference: async (next: string) => { preference = next; await i18n.changeLanguage(next === 'system' ? 'en' : next); },
  refreshSystemLanguage: async () => {},
}));
const { LanguageProvider, useLanguage } = await import('../../apps/mobile/src/i18n/LanguageProvider');

test('mounted language consumer updates text and exercise name without remounting its clock, step or notes', async () => {
  await i18n.changeLanguage('en');
  let now = 0, mounts = 0;
  let change: (next: 'en' | 'it') => Promise<void>;
  let advance: () => void;
  let clock: ReturnType<typeof createPracticeClock>;
  function PracticeProbe() {
    const { language, setPreference } = useLanguage();
    change = setPreference;
    const [timer] = useState(() => { mounts++; const timer = createPracticeClock(() => now); timer.resume(); return timer; });
    clock = timer;
    const [step, setStep] = useState(0);
    const [notes] = useState('My private notes');
    advance = () => setStep(3);
    return React.createElement('probe', { label: tr('Pause practice'), name: localizedExerciseName(seedExercises[0]!.id, 'Canonical', language), step, notes, elapsed: timer.elapsed() });
  }
  let tree: ReactTestRenderer;
  await act(async () => { tree = create(React.createElement(LanguageProvider, { children: React.createElement(PracticeProbe) })); });
  expect(tree!.root.findByType('probe').props.label).toBe('Pause practice');
  now = 12500;
  await act(async () => { advance!(); await change!('it'); });
  const localized = tree!.root.findByType('probe').props;
  expect(localized.label).toBe('Metti in pausa la pratica');
  expect(localized.step).toBe(3); expect(localized.notes).toBe('My private notes');
  expect(localized.elapsed).toBe(12500); expect(mounts).toBe(1);
  const originalClock = clock!;
  await act(async () => { await change!('en'); });
  expect(clock!).toBe(originalClock); expect(mounts).toBe(1);
  expect(tree!.root.findByType('probe').props.label).toBe('Pause practice');
  expect(syncs).toBeGreaterThanOrEqual(3);
  await act(async () => { tree!.unmount(); });
  expect(listeners.size).toBe(0);
});
