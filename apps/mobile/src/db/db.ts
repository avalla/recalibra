import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Exercise, ExerciseWithFavorite } from '../types';
import { seedExercises } from '../data/exercises';
import { SCHEMA_SQL } from './schema';

const DB_NAME = 'recalibra_v2.db';
const MIGRATION_FLAG_KEY = '@recalibra:sqlite_migrated_v2';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function nowIso(): string {
  return new Date().toISOString();
}

function asInt(value: boolean): number {
  return value ? 1 : 0;
}

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

export async function initDb(): Promise<void> {
  const db = await getDb();

  await db.execAsync(SCHEMA_SQL);

  await ensureSeededExercises(db);
  await migrateFromAsyncStorageOnce(db);
  await ensureDefaults(db);

  if (__DEV__) {
    try {
      const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM exercises');
      // eslint-disable-next-line no-console
      console.log('[db] initDb ok', {
        dbName: DB_NAME,
        exercisesInDb: row?.count ?? 0,
        seedExercises: seedExercises.length,
      });
    } catch {
      // eslint-disable-next-line no-console
      console.log('[db] initDb ok', { dbName: DB_NAME });
    }
  }
}

async function ensureSeededExercises(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM exercises');
  const count = row?.count ?? 0;
  if (count > 0) return;

  await db.withTransactionAsync(async () => {
    for (const e of seedExercises) {
      await db.runAsync(
        `INSERT INTO exercises (
          id, name, description, category, level, duration_minutes, image_url,
          instructions_json, safety_warning, audio_preset, origin,
          is_premium, is_active, breathing_pattern_json, history,
          benefits_json, tips_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
        [
          e.id,
          e.name,
          e.description,
          e.category,
          e.level,
          e.duration_minutes,
          e.image_url ?? null,
          JSON.stringify(e.instructions ?? []),
          e.safety_warning ?? null,
          e.audio_preset,
          e.origin ?? null,
          asInt(e.is_premium),
          asInt(e.is_active),
          e.breathing_pattern ? JSON.stringify(e.breathing_pattern) : null,
          e.history ?? null,
          e.benefits ? JSON.stringify(e.benefits) : null,
          e.tips ? JSON.stringify(e.tips) : null,
          e.created_at,
          e.updated_at,
        ]
      );
    }
  });
}

async function ensureDefaults(db: SQLite.SQLiteDatabase): Promise<void> {
  const now = nowIso();

  await db.runAsync(
    'INSERT OR IGNORE INTO goals (id, session_goal, minutes_goal, updated_at) VALUES (1, ?, ?, ?)',
    [3, 30, now]
  );

  await db.runAsync(
    'INSERT OR IGNORE INTO reminders (id, enabled, time, days_json, updated_at) VALUES (1, ?, ?, ?, ?)',
    [0, '09:00', JSON.stringify([1, 2, 3, 4, 5]), now]
  );

  await db.runAsync(
    'INSERT OR IGNORE INTO screening (id, meditation_experience, health_conditions_json, initial_stress_level, updated_at) VALUES (1, ?, ?, ?, ?)',
    ['none', JSON.stringify([]), 5, now]
  );
}

async function migrateFromAsyncStorageOnce(db: SQLite.SQLiteDatabase): Promise<void> {
  const alreadyMigrated = await AsyncStorage.getItem(MIGRATION_FLAG_KEY);
  if (alreadyMigrated === 'true') return;

  await db.withTransactionAsync(async () => {
    await migrateFavorites(db);
    await migrateSessions(db);
    await migrateGoals(db);
    await migrateReminders(db);
    await migrateScreening(db);
  });

  await AsyncStorage.setItem(MIGRATION_FLAG_KEY, 'true');
}

async function migrateFavorites(db: SQLite.SQLiteDatabase): Promise<void> {
  const raw = await AsyncStorage.getItem('@recalibra:favorites_v1');
  if (!raw) return;

  let ids: unknown;
  try {
    ids = JSON.parse(raw);
  } catch {
    return;
  }

  if (!Array.isArray(ids)) return;

  const now = nowIso();
  for (const id of ids) {
    if (typeof id !== 'string') continue;
    await db.runAsync('INSERT OR IGNORE INTO favorites (exercise_id, created_at) VALUES (?, ?)', [id, now]);
  }
}

async function migrateSessions(db: SQLite.SQLiteDatabase): Promise<void> {
  const raw = await AsyncStorage.getItem('sessions_v1');
  if (!raw) return;

  let sessions: unknown;
  try {
    sessions = JSON.parse(raw);
  } catch {
    return;
  }

  if (!Array.isArray(sessions)) return;

  for (const s of sessions) {
    if (!s || typeof s !== 'object') continue;

    const anyS = s as Record<string, unknown>;
    const id = typeof anyS.id === 'string' ? anyS.id : `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const exerciseId = typeof anyS.exercise_id === 'string' ? anyS.exercise_id : null;
    const startedAt = typeof anyS.started_at === 'string' ? anyS.started_at : null;
    const createdAt = typeof anyS.created_at === 'string' ? anyS.created_at : startedAt;

    if (!exerciseId || !startedAt || !createdAt) continue;

    const completedAt = typeof anyS.completed_at === 'string' ? anyS.completed_at : null;
    const durationSeconds = typeof anyS.duration_seconds === 'number' ? Math.max(0, Math.floor(anyS.duration_seconds)) : 0;
    const pre = typeof anyS.pre_stress_level === 'number' ? Math.floor(anyS.pre_stress_level) : 5;
    const post = typeof anyS.post_stress_level === 'number' ? Math.floor(anyS.post_stress_level) : null;
    const notes = typeof anyS.notes === 'string' ? anyS.notes : null;

    await db.runAsync(
      `INSERT OR IGNORE INTO sessions (
        id, exercise_id, started_at, completed_at, duration_seconds,
        pre_stress_level, post_stress_level, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, exerciseId, startedAt, completedAt, durationSeconds, pre, post, notes, createdAt]
    );
  }
}

async function migrateGoals(db: SQLite.SQLiteDatabase): Promise<void> {
  const raw = await AsyncStorage.getItem('@recalibra:weekly_goals_v1');
  if (!raw) return;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return;
  }

  if (!parsed || typeof parsed !== 'object') return;
  const anyG = parsed as Record<string, unknown>;
  const sessionGoal = typeof anyG.sessionGoal === 'number' ? Math.floor(anyG.sessionGoal) : null;
  const minutesGoal = typeof anyG.minutesGoal === 'number' ? Math.floor(anyG.minutesGoal) : null;

  if (sessionGoal === null && minutesGoal === null) return;

  const current = await db.getFirstAsync<{ session_goal: number; minutes_goal: number }>(
    'SELECT session_goal, minutes_goal FROM goals WHERE id = 1'
  );

  await db.runAsync(
    'INSERT OR REPLACE INTO goals (id, session_goal, minutes_goal, updated_at) VALUES (1, ?, ?, ?)',
    [sessionGoal ?? current?.session_goal ?? 3, minutesGoal ?? current?.minutes_goal ?? 30, nowIso()]
  );
}

async function migrateReminders(db: SQLite.SQLiteDatabase): Promise<void> {
  const raw = await AsyncStorage.getItem('@recalibra:reminder_settings_v1');
  if (!raw) return;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return;
  }

  if (!parsed || typeof parsed !== 'object') return;
  const anyR = parsed as Record<string, unknown>;

  const enabled = typeof anyR.enabled === 'boolean' ? asInt(anyR.enabled) : null;
  const time = typeof anyR.time === 'string' ? anyR.time : null;
  const days = Array.isArray(anyR.days) ? anyR.days.filter((d) => typeof d === 'number') : null;

  const current = await db.getFirstAsync<{ enabled: number; time: string; days_json: string }>(
    'SELECT enabled, time, days_json FROM reminders WHERE id = 1'
  );

  await db.runAsync(
    'INSERT OR REPLACE INTO reminders (id, enabled, time, days_json, updated_at) VALUES (1, ?, ?, ?, ?)',
    [
      enabled ?? current?.enabled ?? 0,
      time ?? current?.time ?? '09:00',
      days ? JSON.stringify(days) : current?.days_json ?? JSON.stringify([1, 2, 3, 4, 5]),
      nowIso(),
    ]
  );
}

async function migrateScreening(db: SQLite.SQLiteDatabase): Promise<void> {
  const raw = await AsyncStorage.getItem('@recalibra:screening_profile_v1');
  if (!raw) return;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return;
  }

  if (!parsed || typeof parsed !== 'object') return;
  const anyS = parsed as Record<string, unknown>;

  const meditation = typeof anyS.meditation_experience === 'string' ? anyS.meditation_experience : null;
  const conditions = Array.isArray(anyS.health_conditions)
    ? anyS.health_conditions.filter((x) => typeof x === 'string')
    : null;
  const initialStress = typeof anyS.initial_stress_level === 'number' ? Math.floor(anyS.initial_stress_level) : null;

  const current = await db.getFirstAsync<{
    meditation_experience: string;
    health_conditions_json: string;
    initial_stress_level: number;
  }>('SELECT meditation_experience, health_conditions_json, initial_stress_level FROM screening WHERE id = 1');

  await db.runAsync(
    'INSERT OR REPLACE INTO screening (id, meditation_experience, health_conditions_json, initial_stress_level, updated_at) VALUES (1, ?, ?, ?, ?)',
    [
      meditation ?? current?.meditation_experience ?? 'none',
      conditions ? JSON.stringify(conditions) : current?.health_conditions_json ?? JSON.stringify([]),
      initialStress ?? current?.initial_stress_level ?? 5,
      nowIso(),
    ]
  );
}

export async function getExercisesWithFavorites(): Promise<ExerciseWithFavorite[]> {
  const db = await getDb();

  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    description: string;
    category: string;
    level: string;
    duration_minutes: number;
    image_url: string | null;
    instructions_json: string;
    safety_warning: string | null;
    audio_preset: string;
    origin: string | null;
    is_premium: number;
    is_active: number;
    breathing_pattern_json: string | null;
    history: string | null;
    benefits_json: string | null;
    tips_json: string | null;
    created_at: string;
    updated_at: string;
    is_favorite: number;
  }>(
    `SELECT e.*, CASE WHEN f.exercise_id IS NULL THEN 0 ELSE 1 END as is_favorite
     FROM exercises e
     LEFT JOIN favorites f ON f.exercise_id = e.id
     WHERE e.is_active = 1
     ORDER BY e.name ASC`
  );

  return rows.map((r): ExerciseWithFavorite => {
    const exercise: Exercise = {
      id: r.id,
      name: r.name,
      description: r.description,
      category: r.category as Exercise['category'],
      level: r.level as Exercise['level'],
      duration_minutes: r.duration_minutes,
      image_url: r.image_url ?? undefined,
      instructions: JSON.parse(r.instructions_json) as Exercise['instructions'],
      safety_warning: r.safety_warning ?? undefined,
      audio_preset: r.audio_preset as Exercise['audio_preset'],
      origin: (r.origin ?? undefined) as Exercise['origin'],
      is_premium: r.is_premium === 1,
      is_active: r.is_active === 1,
      breathing_pattern: r.breathing_pattern_json ? (JSON.parse(r.breathing_pattern_json) as Exercise['breathing_pattern']) : undefined,
      history: r.history ?? undefined,
      benefits: r.benefits_json ? (JSON.parse(r.benefits_json) as Exercise['benefits']) : undefined,
      tips: r.tips_json ? (JSON.parse(r.tips_json) as Exercise['tips']) : undefined,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };

    return {
      ...exercise,
      is_favorite: r.is_favorite === 1,
    };
  });
}

export async function toggleFavorite(exerciseId: string, nextIsFavorite: boolean): Promise<void> {
  const db = await getDb();
  if (nextIsFavorite) {
    await db.runAsync('INSERT OR IGNORE INTO favorites (exercise_id, created_at) VALUES (?, ?)', [exerciseId, nowIso()]);
  } else {
    await db.runAsync('DELETE FROM favorites WHERE exercise_id = ?', [exerciseId]);
  }
}
