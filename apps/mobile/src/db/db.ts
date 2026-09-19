import * as SQLite from 'expo-sqlite';
import type { ExerciseCategory } from '../types';

import { seedExercises } from '../data/exercises';
import { buildUniqueSlugs } from '../data/slug';
import { inferObjective } from '../utils/infer-objective';
import { logger } from '../utils/logger';
import { SCHEMA_SQL } from './schema';
import { journeyDefinitions } from '../data/journeys';
import { findInvalidJourneyExerciseSlugs } from '../features/journeys/state';

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

  const invalidJourneySlugs = findInvalidJourneyExerciseSlugs(
    journeyDefinitions,
    seedExercises.map((exercise) => exercise.slug)
  );
  if (invalidJourneySlugs.length > 0) {
    throw new Error(`Invalid journey exercise slugs: ${invalidJourneySlugs.join(', ')}`);
  }

  await db.execAsync(SCHEMA_SQL);

  await ensureExercisesSlugColumn(db);
  await ensureExercisesObjectiveColumn(db);
  await ensureExercisesObjectiveBackfill(db);
  await ensureExercisesMediaColumn(db);

  await ensureSeededExercises(db);
  await ensureSeededJourneys(db);
  await ensureDefaults(db);

  if (__DEV__) {
    try {
      const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM exercises');
      logger.debug(
        `initDb ok db=${DB_NAME} exercisesInDb=${row?.count ?? 0} seedExercises=${seedExercises.length}`,
        'db'
      );
    } catch {
      logger.debug(`initDb ok db=${DB_NAME}`, 'db');
    }
  }
}

async function ensureSeededJourneys(db: SQLite.SQLiteDatabase): Promise<void> {
  const now = nowIso();

  await db.withTransactionAsync(async () => {
    for (const journey of journeyDefinitions) {
      await db.runAsync(
        `INSERT INTO journeys (id, slug, title, description, total_chapters, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           slug = excluded.slug,
           title = excluded.title,
           description = excluded.description,
           total_chapters = excluded.total_chapters,
           updated_at = excluded.updated_at`,
        [journey.id, journey.slug, journey.title, journey.description, journey.chapters.length, now, now]
      );
      await db.runAsync(
        `INSERT OR IGNORE INTO journey_progress
          (journey_id, current_chapter, completed_chapters_json, updated_at)
         VALUES (?, 0, '[]', ?)`,
        [journey.id, now]
      );
    }
  });
}

async function ensureSeededExercises(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM exercises');
  const count = row?.count ?? 0;
  if (count > 0) return;

  await db.withTransactionAsync(async () => {
    for (const e of seedExercises) {
      await db.runAsync(
        `INSERT INTO exercises (
          id, slug, name, description, category, objective, level, duration_minutes, image_url, media_json,
          instructions_json, safety_warning, audio_preset, origin,
          is_premium, is_active, breathing_pattern_json, history,
          benefits_json, tips_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
        [
          e.id,
          e.slug,
          e.name,
          e.description,
          e.category,
          e.objective,
          e.level,
          e.duration_minutes,
          e.image_url ?? null,
          e.media ? JSON.stringify(e.media) : null,
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

async function ensureExercisesMediaColumn(db: SQLite.SQLiteDatabase): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(exercises)');
  const hasMedia = columns.some((c) => c.name === 'media_json');
  if (hasMedia) return;

  await db.execAsync('ALTER TABLE exercises ADD COLUMN media_json TEXT;');
}

async function ensureExercisesSlugColumn(db: SQLite.SQLiteDatabase): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(exercises)');
  const hasSlug = columns.some((c) => c.name === 'slug');
  if (!hasSlug) {
    await db.execAsync("ALTER TABLE exercises ADD COLUMN slug TEXT NOT NULL DEFAULT '';");
  }

  const rows = await db.getAllAsync<{ id: string; name: string; slug: string }>('SELECT id, name, slug FROM exercises');
  const seedSlugById = new Map(seedExercises.map((e) => [e.id, e.slug] as const));
  const slugsById = buildUniqueSlugs(rows.map((r) => ({ id: r.id, name: r.name })));
  const isLegacySlug = (value: string) => /-[0-9a-f]{8}$/.test(value);

  await db.withTransactionAsync(async () => {
    for (const r of rows) {
      const current = (r.slug ?? '').trim();
      if (current && !isLegacySlug(current)) continue;
      const nextSlug = seedSlugById.get(r.id) ?? slugsById[r.id] ?? current;
      if (!nextSlug) continue;
      await db.runAsync('UPDATE exercises SET slug = ? WHERE id = ?', [nextSlug, r.id]);
    }
  });
}

async function ensureExercisesObjectiveColumn(db: SQLite.SQLiteDatabase): Promise<void> {
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(exercises)');
  const hasObjective = columns.some((c) => c.name === 'objective');
  if (hasObjective) return;

  await db.execAsync("ALTER TABLE exercises ADD COLUMN objective TEXT NOT NULL DEFAULT 'relax';");
  await db.execAsync("UPDATE exercises SET objective = 'relax' WHERE objective IS NULL OR objective = ''; ");
}

async function ensureExercisesObjectiveBackfill(db: SQLite.SQLiteDatabase): Promise<void> {
  const seedObjectiveById = new Map(seedExercises.map((e) => [e.id, e.objective] as const));
  const seedObjectiveBySlug = new Map(seedExercises.map((e) => [e.slug, e.objective] as const));

  const rows = await db.getAllAsync<{
    id: string;
    slug: string;
    name: string;
    description: string;
    category: ExerciseCategory;
    objective: string;
    breathing_pattern_json: string | null;
  }>('SELECT id, slug, name, description, category, objective, breathing_pattern_json FROM exercises');

  await db.withTransactionAsync(async () => {
    for (const r of rows) {
      const mapped = seedObjectiveById.get(r.id) ?? seedObjectiveBySlug.get(r.slug);
      if (mapped && mapped !== 'relax') {
        await db.runAsync('UPDATE exercises SET objective = ? WHERE id = ?', [mapped, r.id]);
        continue;
      }

      const inferred = inferObjective({
        name: r.name,
        description: r.description,
        category: r.category,
        breathingPatternJson: r.breathing_pattern_json,
      });

      const current = (r.objective ?? '').trim();
      if (current && current !== 'relax') continue;
      if (inferred === 'relax') continue;

      await db.runAsync('UPDATE exercises SET objective = ? WHERE id = ?', [inferred, r.id]);
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
