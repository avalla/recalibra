import { afterEach, expect, test } from 'bun:test';
import { Database } from 'bun:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { i18n, tr, formatMinutes, formatNumber, formatDate } from '../apps/mobile/src/i18n/core';
import { resolveLanguage, type LanguagePreference } from '../apps/mobile/src/i18n/language';
import { createLanguageController } from '../apps/mobile/src/i18n/controller';
import { localizeExercise, exerciseText, localizedExerciseName } from '../apps/mobile/src/i18n/exercises';
import { LANGUAGE_SCHEMA_SQL } from '../apps/mobile/src/db/language-schema';
import { seedExercises } from '../apps/mobile/src/data/exercises';
import { filterCatalog, EMPTY_CATALOG_FILTERS } from '../apps/mobile/src/utils/catalog-filters';
import { getExerciseRecommendation } from '../apps/mobile/src/utils/recommendation';
import en from '../apps/mobile/src/i18n/locales/en.json';
import it from '../apps/mobile/src/i18n/locales/it.json';
import exercisesEn from '../apps/mobile/src/i18n/locales/exercises.en.json';
import exercisesIt from '../apps/mobile/src/i18n/locales/exercises.it.json';

afterEach(async () => { await i18n.changeLanguage('en'); });

test('system language supports regional Italian and falls back to English; explicit choice wins', () => {
  for (const tag of ['it', 'it-IT', 'it-CH', 'IT-it']) expect(resolveLanguage('system', tag)).toBe('it');
  for (const tag of ['en-GB', 'de-DE', 'ja-JP', undefined]) expect(resolveLanguage('system', tag)).toBe('en');
  expect(resolveLanguage('en', 'it-IT')).toBe('en');
  expect(resolveLanguage('it', 'en-US')).toBe('it');
});

test('bundled UI keys, interpolation parameters and plural forms match', () => {
  expect(Object.keys(it).sort()).toEqual(Object.keys(en).sort());
  const placeholders = (value: string) => [...value.matchAll(/{{\s*([^{}]+)\s*}}/g)].map(m => m[1]).sort();
  for (const [key, value] of Object.entries(en)) {
    expect(value.trim().length).toBeGreaterThan(0);
    const translation = it[key as keyof typeof it];
    expect(translation.trim().length).toBeGreaterThan(0);
    expect(placeholders(translation)).toEqual(placeholders(value));
  }
});

test('plurals, interpolated values, missing key fallback and locale formatting work offline', async () => {
  await i18n.changeLanguage('it');
  expect(formatMinutes(1)).toBe('1 minuto');
  expect(formatMinutes(2)).toBe('2 minuti');
  expect(tr('days', { count: 1 })).toBe('1 giorno');
  expect(tr('days', { count: 3 })).toBe('3 giorni');
  expect(tr('Hi {{name}},', { name: 'Ada' })).toBe('Ciao Ada,');
  expect(tr('Readable future fallback')).toBe('Readable future fallback');
  expect(formatNumber(5.5)).toBe('5,5');
  expect(formatDate(new Date(2026, 8, 7, 12), { month: 'long' })).toBe('settembre');
  await i18n.changeLanguage('en');
  expect(formatMinutes(1)).toBe('1 minute');
  expect(formatMinutes(2)).toBe('2 minutes');
  expect(formatNumber(5.5)).toBe('5.5');
});

test('all 95 exercises preserve protocol, order, warnings, access and identity in both languages', () => {
  expect(seedExercises).toHaveLength(95);
  expect(Object.keys(exercisesIt).sort()).toEqual(seedExercises.map(e => e.id).sort());
  expect(Object.keys(exercisesEn).sort()).toEqual(Object.keys(exercisesIt).sort());
  for (const exercise of seedExercises) {
    const before = JSON.stringify(exercise);
    const translated = localizeExercise(exercise, 'it');
    expect(translated.instructions.map(step => step.step)).toEqual(exercise.instructions.map(step => step.step));
    expect(translated.benefits?.length).toEqual(exercise.benefits?.length);
    expect(translated.tips?.length).toEqual(exercise.tips?.length);
    expect(Boolean(translated.safety_warning)).toBe(Boolean(exercise.safety_warning));
    expect(translated.name.length).toBeGreaterThan(0);
    for (const key of ['id','slug','category','objective','duration_minutes','level','audio_preset','origin','is_premium','is_active','breathing_pattern'] as const) expect(translated[key]).toEqual(exercise[key]);
    expect(JSON.stringify(exercise)).toBe(before);
    for (const key of ['name', 'description', 'instructions', 'safety_warning', 'history', 'benefits', 'tips'] as const) expect(localizeExercise(exercise, 'en')[key]).toEqual(exercise[key]);
  }
  expect(exerciseText('future-id', { name: 'Future exercise' }, 'it').name).toBe('Future exercise');
});

test('localized search and history use IDs while canonical ranking stays unchanged', async () => {
  const canonical = seedExercises.map(e => ({ ...e, is_favorite: false }));
  const input = { exercises: canonical, objective: 'relax' as const, minutesAvailable: 5, now: new Date('2026-09-07T09:00:00Z') };
  const ranked = getExerciseRecommendation(input).map(e => e.id);
  await i18n.changeLanguage('it');
  const translated = canonical.map(e => localizeExercise(e));
  const target = translated.find(e => e.name !== canonical.find(c => c.id === e.id)!.name)!;
  expect(filterCatalog(translated, { ...EMPTY_CATALOG_FILTERS, query: target.name }).map(e => e.id)).toContain(target.id);
  expect(localizedExerciseName(target.id, 'Old stored name')).toBe(target.name);
  expect(getExerciseRecommendation(input).map(e => e.id)).toEqual(ranked);
});

test('SQLite migration preserves existing data, is repeatable and retains preference after reopen', () => {
  const dir = mkdtempSync(join(tmpdir(), 'recalibra-language-'));
  const file = join(dir, 'legacy.db');
  let db = new Database(file);
  try {
    db.exec("CREATE TABLE sessions (id TEXT, notes TEXT); INSERT INTO sessions VALUES ('one', 'My untouched notes');");
    db.exec(LANGUAGE_SCHEMA_SQL);
    expect(db.query("SELECT value FROM app_settings WHERE key='language'").get()).toEqual({ value: 'system' });
    db.run("UPDATE app_settings SET value='it' WHERE key='language'");
    db.exec(LANGUAGE_SCHEMA_SQL);
    db.close(); db = new Database(file);
    expect(db.query("SELECT value FROM app_settings WHERE key='language'").get()).toEqual({ value: 'it' });
    expect(db.query('SELECT * FROM sessions').get()).toEqual({ id: 'one', notes: 'My untouched notes' });
  } finally { db.close(); rmSync(dir, { recursive: true }); }
});

test('rapid preferences serialize; failed saves preserve current language and allow retry', async () => {
  let saved: LanguagePreference = 'system', tag = 'it-IT', active = 'en', fail = false;
  const storage = { read: async () => saved, write: async (next: LanguagePreference) => { await Promise.resolve(); if (fail) throw Error('disk'); saved = next; } };
  const controller = createLanguageController(storage, () => tag, async lang => { active = lang; });
  await controller.initialize(); expect(active).toBe('it');
  await Promise.all([controller.change('en'), controller.change('it'), controller.change('en')]);
  expect(saved).toBe('en'); expect(active).toBe('en');
  tag = 'it-CH'; await controller.refresh(); expect(active).toBe('en');
  fail = true; await expect(controller.change('it')).rejects.toThrow('disk');
  expect(controller.preference()).toBe('en'); expect(active).toBe('en');
  fail = false; await controller.change('system'); expect(active).toBe('it');
  tag = 'fr-FR'; await controller.refresh(); expect(active).toBe('en');
  const restarted = createLanguageController(storage, () => tag, async lang => { active = lang; });
  await restarted.initialize(); expect(restarted.preference()).toBe('system'); expect(active).toBe('en');
});
