import * as SQLite from 'expo-sqlite';

import { seedExercises } from '../data/exercises';
import { SCHEMA_SQL } from './schema';

const DB_NAME = 'recalibra_v3.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function nowIso(): string {
  return new Date().toISOString();
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
          e.is_premium ? 1 : 0,
          e.is_active ? 1 : 0,
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
