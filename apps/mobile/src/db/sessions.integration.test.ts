import { beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test';
import { Database } from 'bun:sqlite';
import { returnToCenterJourney } from '../data/journeys';
import { SCHEMA_SQL } from './schema';

type SqlValue = string | number | bigint | boolean | null | Uint8Array;

const sqlite = new Database(':memory:');
const runtime = globalThis as typeof globalThis & { __DEV__: boolean };
runtime.__DEV__ = false;
const db = {
  execAsync: async (sql: string) => {
    sqlite.exec(sql);
  },
  runAsync: async (sql: string, params: readonly SqlValue[] = []) => {
    const result = sqlite.query(sql).run(...params);
    return { changes: result.changes, lastInsertRowId: result.lastInsertRowid };
  },
  getAllAsync: async <T>(sql: string, params: readonly SqlValue[] = []) =>
    sqlite.query(sql).all(...params) as T[],
  getFirstAsync: async <T>(sql: string, params: readonly SqlValue[] = []) =>
    (sqlite.query(sql).get(...params) as T | null) ?? null,
  withTransactionAsync: async (task: () => Promise<void>) => {
    sqlite.exec('BEGIN');
    try {
      await task();
      sqlite.exec('COMMIT');
    } catch (error) {
      sqlite.exec('ROLLBACK');
      throw error;
    }
  },
};

mock.module('expo-sqlite', () => ({
  openDatabaseAsync: async () => db,
}));

const { completeSession, completeSessionAndJourney } = await import('./sessions');

const journeyId = returnToCenterJourney.id;
const exerciseId = 'exercise-test';

async function insertJourneyProgress(overrides: {
  currentChapter?: number;
  completedChapterIds?: string[];
  completedAt?: string | null;
} = {}): Promise<void> {
  const now = '2026-09-19T00:00:00.000Z';
  await db.runAsync(
    `INSERT INTO journey_progress
      (journey_id, current_chapter, completed_chapters_json, completed_at, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      journeyId,
      overrides.currentChapter ?? 0,
      JSON.stringify(overrides.completedChapterIds ?? []),
      overrides.completedAt ?? null,
      now,
    ]
  );
}

async function insertSession(sessionId: string, completedAt: string | null = null): Promise<void> {
  const now = '2026-09-19T00:00:00.000Z';
  await db.runAsync(
    `INSERT INTO sessions
      (id, exercise_id, started_at, completed_at, duration_seconds, pre_stress_level, post_stress_level, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [sessionId, exerciseId, now, completedAt, 0, 7, null, null, now]
  );
}

async function readSession(sessionId: string) {
  return db.getFirstAsync<{
    completed_at: string | null;
    duration_seconds: number;
    post_stress_level: number | null;
    notes: string | null;
  }>(
    'SELECT completed_at, duration_seconds, post_stress_level, notes FROM sessions WHERE id = ?',
    [sessionId]
  );
}

async function readJourneyProgress() {
  return db.getFirstAsync<{
    current_chapter: number;
    completed_chapters_json: string;
    completed_at: string | null;
  }>(
    'SELECT current_chapter, completed_chapters_json, completed_at FROM journey_progress WHERE journey_id = ?',
    [journeyId]
  );
}

beforeAll(async () => {
  await db.execAsync(SCHEMA_SQL);
});

beforeEach(async () => {
  await db.execAsync('DELETE FROM journey_progress; DELETE FROM journeys; DELETE FROM sessions; DELETE FROM exercises;');
  await db.runAsync(
    `INSERT INTO exercises
      (id, slug, name, description, category, objective, level, duration_minutes, instructions_json, audio_preset, is_premium, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [exerciseId, 'test-exercise', 'Test exercise', 'Test exercise', 'breathing', 'relax', 'beginner', 5, '[]', 'silence', 0, 1, 'now', 'now']
  );
  await db.runAsync(
    `INSERT INTO journeys (id, slug, title, description, total_chapters, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [journeyId, 'test-journey', 'Test journey', 'Test journey', returnToCenterJourney.chapters.length, 'now', 'now']
  );
});

describe('session and journey SQLite transactions', () => {
  test('completes the session and journey atomically', async () => {
    await insertSession('session-success');
    await insertJourneyProgress();

    const result = await completeSessionAndJourney({
      sessionId: 'session-success', durationSeconds: 125, postStressLevel: 3,
      notes: 'felt calmer', journeyId, chapterIndex: 0,
    });
    const session = await readSession('session-success');
    const progress = await readJourneyProgress();

    expect(result.error).toBeNull();
    expect(result.progress).toMatchObject({ currentChapter: 1, completedChapterIds: ['notice'] });
    expect(session).toMatchObject({ duration_seconds: 125, post_stress_level: 3, notes: 'felt calmer' });
    expect(session?.completed_at).toBeTruthy();
    expect(progress).toMatchObject({ current_chapter: 1, completed_at: null });
    expect(JSON.parse(progress?.completed_chapters_json ?? '[]')).toEqual(['notice']);
  });

  test('does not advance the journey for a missing session', async () => {
    await insertJourneyProgress();

    const result = await completeSessionAndJourney({
      sessionId: 'missing-session', durationSeconds: 125, postStressLevel: 3,
      journeyId, chapterIndex: 0,
    });
    const progress = await readJourneyProgress();

    expect(result.error).toBeInstanceOf(Error);
    expect(result.progress).toBeNull();
    expect(progress).toMatchObject({ current_chapter: 0, completed_chapters_json: '[]', completed_at: null });
  });

  test('rolls back session completion when journey completion fails', async () => {
    await insertSession('session-journey-failure');
    await insertJourneyProgress();

    const result = await completeSessionAndJourney({
      sessionId: 'session-journey-failure', durationSeconds: 125, postStressLevel: 3,
      notes: 'must roll back', journeyId, chapterIndex: 1,
    });
    const session = await readSession('session-journey-failure');
    const progress = await readJourneyProgress();

    expect(result.error).toBeInstanceOf(Error);
    expect(result.progress).toBeNull();
    expect(session).toMatchObject({ completed_at: null, duration_seconds: 0, post_stress_level: null, notes: null });
    expect(progress).toMatchObject({ current_chapter: 0, completed_chapters_json: '[]', completed_at: null });
  });

  test('keeps completion timestamps stable across valid retries', async () => {
    await insertSession('session-retry');
    await insertJourneyProgress({
      currentChapter: returnToCenterJourney.chapters.length - 1,
      completedChapterIds: returnToCenterJourney.chapters.slice(0, -1).map((chapter) => chapter.id),
    });

    const first = await completeSessionAndJourney({
      sessionId: 'session-retry', durationSeconds: 125, postStressLevel: 3,
      journeyId, chapterIndex: returnToCenterJourney.chapters.length - 1,
    });
    const afterFirstSession = await readSession('session-retry');
    const afterFirstProgress = await readJourneyProgress();

    const second = await completeSessionAndJourney({
      sessionId: 'session-retry', durationSeconds: 300, postStressLevel: 2,
      notes: 'retry', journeyId, chapterIndex: returnToCenterJourney.chapters.length - 1,
    });
    const afterSecondSession = await readSession('session-retry');
    const afterSecondProgress = await readJourneyProgress();

    expect(first.error).toBeNull();
    expect(second.error).toBeNull();
    expect(first.progress?.completedAt).toBeTruthy();
    expect(second.progress?.completedAt).toBe(first.progress?.completedAt);
    expect(afterSecondProgress?.completed_at).toBe(afterFirstProgress?.completed_at);
    const completedChapterIds = JSON.parse(afterSecondProgress?.completed_chapters_json ?? '[]') as string[];
    expect(completedChapterIds).toHaveLength(returnToCenterJourney.chapters.length);
    expect(new Set(completedChapterIds).size).toBe(returnToCenterJourney.chapters.length);
    expect(afterSecondSession?.completed_at).toBe(afterFirstSession?.completed_at);
    expect(afterSecondSession).toMatchObject({ duration_seconds: 300, post_stress_level: 2, notes: 'retry' });
  });

  test('fails normal completion when the session does not exist', async () => {
    const result = await completeSession({
      sessionId: 'missing-session', durationSeconds: 60, postStressLevel: 2,
    });

    expect(result.error).toBeInstanceOf(Error);
  });

  test('preserves completed_at for normal completion retries', async () => {
    await insertSession('session-normal-retry');

    const first = await completeSession({
      sessionId: 'session-normal-retry', durationSeconds: 60, postStressLevel: 4,
    });
    const afterFirst = await readSession('session-normal-retry');
    const second = await completeSession({
      sessionId: 'session-normal-retry', durationSeconds: 120, postStressLevel: 2, notes: 'retry',
    });
    const afterSecond = await readSession('session-normal-retry');

    expect(first.error).toBeNull();
    expect(second.error).toBeNull();
    expect(afterSecond?.completed_at).toBe(afterFirst?.completed_at);
    expect(afterSecond).toMatchObject({ duration_seconds: 120, post_stress_level: 2, notes: 'retry' });
  });
});
