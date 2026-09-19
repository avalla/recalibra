import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test';
import { Database } from 'bun:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Journey } from '../apps/mobile/src/types';
import { ensureJourneySchema } from '../apps/mobile/src/db/journey-migrations';
import { validateJourney } from '../apps/mobile/src/utils/journeys';

const directory = mkdtempSync(join(tmpdir(), 'recalibra-journeys-'));
const filename = join(directory, 'journeys.db');
let sqlite = new Database(filename);
const adapter = {
  async getAllAsync<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return sqlite.query(sql).all(...params as never[]) as T[];
  },
  async getFirstAsync<T>(sql: string, params: unknown[] = []): Promise<T | null> {
    return (sqlite.query(sql).get(...params as never[]) as T | null) ?? null;
  },
  async execAsync(sql: string) { sqlite.exec(sql); },
  async runAsync(sql: string, params: unknown[] = []) { return sqlite.query(sql).run(...params as never[]); },
  async withTransactionAsync(callback: () => Promise<void>) {
    sqlite.exec('BEGIN');
    try {
      await callback();
      sqlite.exec('COMMIT');
    } catch (error) {
      sqlite.exec('ROLLBACK');
      throw error;
    }
  },
};

mock.module('../apps/mobile/src/db/db', () => ({ getDb: async () => adapter }));
const { completeJourneyStep, ensureJourneyProgress, getJourneyProgress, startJourney } = await import('../apps/mobile/src/db/journeys');

const journey: Journey = {
  id: 'return-to-center',
  version: 1,
  slug: 'return-to-center',
  title: 'Return to center',
  description: 'A deterministic journey fixture.',
  chapters: [
    {
      id: 'chapter-1',
      title: 'Arrive',
      order: 1,
      steps: [
        { id: 'step-1', exerciseId: 'exercise-1', title: 'Notice', order: 1 },
        { id: 'step-2', exerciseId: 'exercise-2', title: 'Settle', order: 2 },
      ],
    },
    {
      id: 'chapter-2',
      title: 'Continue',
      order: 2,
      steps: [{ id: 'step-3', exerciseId: 'exercise-3', title: 'Return', order: 1 }],
    },
  ],
};

function createSchema(): void {
  sqlite.exec(`
    CREATE TABLE exercises (id TEXT PRIMARY KEY, name TEXT, category TEXT, duration_minutes INTEGER);
    CREATE TABLE sessions (
      id TEXT PRIMARY KEY, exercise_id TEXT, started_at TEXT, completed_at TEXT,
      duration_seconds INTEGER, pre_stress_level INTEGER, post_stress_level INTEGER,
      pre_stress_recorded INTEGER NOT NULL DEFAULT 0, post_stress_recorded INTEGER NOT NULL DEFAULT 0,
      notes TEXT, created_at TEXT
    );
  `);
}

beforeEach(async () => {
  sqlite.exec('DROP TABLE IF EXISTS journey_step_progress; DROP TABLE IF EXISTS journey_progress; DROP TABLE IF EXISTS sessions; DROP TABLE IF EXISTS exercises;');
  createSchema();
  sqlite.query('INSERT INTO sessions (id, exercise_id, started_at, duration_seconds, pre_stress_level, created_at) VALUES (?, ?, ?, ?, ?, ?)').run('legacy-session', 'legacy-exercise', '2025-01-01', 90, 6, '2025-01-01');
  await ensureJourneySchema(adapter);
});

afterAll(() => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); });

describe('Journey content invariants', () => {
  test('rejects duplicate exercise assignments so resume cannot be ambiguous', () => {
    expect(() => validateJourney({
      ...journey,
      chapters: [{
        ...journey.chapters[0],
        steps: [journey.chapters[0].steps[0], { ...journey.chapters[0].steps[1], exerciseId: 'exercise-1' }],
      }],
    })).toThrow('duplicate exercise id');
  });
});

describe('Journey SQLite progress', () => {
  test('migration is additive and repeatable', async () => {
    await ensureJourneySchema(adapter);
    expect(sqlite.query("SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('journey_progress', 'journey_step_progress') ORDER BY name").all()).toEqual([
      { name: 'journey_progress' },
      { name: 'journey_step_progress' },
    ]);
    const names = sqlite.query('PRAGMA table_info(sessions)').all().map((row: any) => row.name);
    expect(names).toEqual(expect.arrayContaining(['journey_id', 'journey_step_id']));
    expect(sqlite.query('SELECT exercise_id, duration_seconds FROM sessions WHERE id = ?').get('legacy-session')).toEqual({ exercise_id: 'legacy-exercise', duration_seconds: 90 });
  });

  test('creates one stable pointer and starts idempotently', async () => {
    const initial = await ensureJourneyProgress(journey);
    expect(initial).toMatchObject({ status: 'not_started', currentChapterId: 'chapter-1', currentStepId: 'step-1', completedStepIds: [] });
    const started = await startJourney(journey);
    const repeated = await startJourney(journey);
    expect(started).toMatchObject({ status: 'in_progress', currentStepId: 'step-1' });
    expect(repeated.startedAt).toBe(started.startedAt);
    expect(sqlite.query('SELECT COUNT(*) as count FROM journey_progress').get()).toEqual({ count: 1 });
  });

  test('advances by stable IDs, links the session and rejects out-of-order steps', async () => {
    await startJourney(journey);
    sqlite.query('INSERT INTO sessions (id, exercise_id, started_at, duration_seconds, pre_stress_level, created_at) VALUES (?, ?, ?, ?, ?, ?)').run('session-1', 'exercise-1', '2026-01-01', 60, 5, '2026-01-01');
    sqlite.query('INSERT INTO sessions (id, exercise_id, started_at, duration_seconds, pre_stress_level, created_at) VALUES (?, ?, ?, ?, ?, ?)').run('session-2', 'exercise-2', '2026-01-01', 60, 5, '2026-01-01');

    await expect(completeJourneyStep({ journey, stepId: 'step-2', sessionId: 'session-2' })).rejects.toThrow('expected step step-1');
    const next = await completeJourneyStep({ journey, stepId: 'step-1', sessionId: 'session-1' });
    expect(next).toMatchObject({ status: 'in_progress', currentChapterId: 'chapter-1', currentStepId: 'step-2', completedStepIds: ['step-1'] });
    const repeated = await completeJourneyStep({ journey, stepId: 'step-1', sessionId: 'session-1' });
    expect(repeated).toEqual(next);
    expect(sqlite.query('SELECT journey_id, journey_step_id FROM sessions WHERE id = ?').get('session-1')).toEqual({ journey_id: journey.id, journey_step_id: 'step-1' });
    expect(sqlite.query('SELECT COUNT(*) as count FROM journey_step_progress').get()).toEqual({ count: 1 });
  });

  test('does not start or mutate progress when the linked session is invalid', async () => {
    await expect(completeJourneyStep({ journey, stepId: 'step-1', sessionId: 'legacy-session' })).rejects.toThrow('does not match Journey step');
    await expect(getJourneyProgress(journey.id)).resolves.toMatchObject({ status: 'not_started', currentStepId: 'step-1', completedStepIds: [] });
  });

  test('completes the final step and preserves the terminal pointer state', async () => {
    await startJourney(journey);
    for (const [stepId, sessionId, exerciseId] of [['step-1', 'session-1', 'exercise-1'], ['step-2', 'session-2', 'exercise-2'], ['step-3', 'session-3', 'exercise-3']] as const) {
      sqlite.query('INSERT INTO sessions (id, exercise_id, started_at, duration_seconds, pre_stress_level, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(sessionId, exerciseId, '2026-01-01', 60, 5, '2026-01-01');
      await completeJourneyStep({ journey, stepId, sessionId });
    }
    await expect(getJourneyProgress(journey.id)).resolves.toMatchObject({ status: 'completed', currentChapterId: undefined, currentStepId: undefined, completedStepIds: ['step-1', 'step-2', 'step-3'] });
  });
});
