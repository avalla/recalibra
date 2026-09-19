import { afterAll, beforeEach, describe, expect, mock, test } from 'bun:test';
import { Database } from 'bun:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Session } from '../apps/mobile/src/types';
import { ensureSessionStressColumns } from '../apps/mobile/src/db/session-migrations';
import { describeStressChange, STRESS_OPTIONS, summarizeSessionStress } from '../apps/mobile/src/utils/stress-rating';

const directory = mkdtempSync(join(tmpdir(), 'recalibra-stress-'));
const filename = join(directory, 'sessions.db');
let sqlite = new Database(filename);
const adapter = {
  async getAllAsync<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return sqlite.query(sql).all(...params as never[]) as T[];
  },
  async execAsync(sql: string) { sqlite.exec(sql); },
  async runAsync(sql: string, params: unknown[] = []) { return sqlite.query(sql).run(...params as never[]); },
};
mock.module('../apps/mobile/src/db/db', () => ({ getDb: async () => adapter }));
const { startSession, completeSession, listSessions } = await import('../apps/mobile/src/db/sessions');

const legacySchema = `
  CREATE TABLE exercises (id TEXT PRIMARY KEY, name TEXT, category TEXT, duration_minutes INTEGER);
  INSERT INTO exercises VALUES ('breathing', 'Breathing', 'breathing', 5);
  CREATE TABLE sessions (
    id TEXT PRIMARY KEY, user_id TEXT, exercise_id TEXT, started_at TEXT,
    completed_at TEXT, duration_seconds INTEGER, pre_stress_level INTEGER NOT NULL,
    post_stress_level INTEGER, notes TEXT, created_at TEXT
  );
  INSERT INTO sessions VALUES ('legacy', NULL, 'breathing', '2026-01-01', '2026-01-01', 120, 8, 5, 'Keep this note', '2026-01-01');
`;

beforeEach(async () => {
  sqlite.exec('DROP TABLE IF EXISTS sessions; DROP TABLE IF EXISTS exercises;');
  sqlite.exec(legacySchema);
  await ensureSessionStressColumns(adapter);
});

afterAll(() => { sqlite.close(); rmSync(directory, { recursive: true, force: true }); });

describe('SQLite stress responses', () => {
  test('migration is additive, repeatable and leaves legacy values unverified', async () => {
    await ensureSessionStressColumns(adapter);
    const [session] = await listSessions();
    expect(session).toMatchObject({ pre_stress_level: 8, post_stress_level: 5, notes: 'Keep this note', pre_stress_recorded: false, post_stress_recorded: false });
    expect(summarizeSessionStress(await listSessions())).toEqual({ averagePostStress: null, averageReduction: null });
  });

  test('explicit before/after values and provenance survive closing and reopening SQLite', async () => {
    const started = await startSession({ exerciseId: 'breathing', preStressLevel: 7, preStressRecorded: true });
    expect(started.error).toBeNull();
    const result = await completeSession({ sessionId: started.data!.id, durationSeconds: 180, postStressLevel: 3 });
    expect(result.error).toBeNull();
    sqlite.close();
    sqlite = new Database(filename);
    const sessions = await listSessions();
    expect(sessions.find((s) => s.id === started.data!.id)).toMatchObject({ pre_stress_level: 7, post_stress_level: 3, pre_stress_recorded: true, post_stress_recorded: true, duration_seconds: 180 });
    expect(summarizeSessionStress(sessions)).toEqual({ averagePostStress: 3, averageReduction: 4 });
  });

  test('skipping checkout completes the practice without inventing a response', async () => {
    const started = await startSession({ exerciseId: 'breathing', preStressLevel: 7, preStressRecorded: true });
    expect((await completeSession({ sessionId: started.data!.id, durationSeconds: 120, postStressLevel: null, notes: 'No rating' })).error).toBeNull();
    const session = (await listSessions()).find((s) => s.id === started.data!.id)!;
    expect(session.completed_at).toBeDefined();
    expect(session.post_stress_level).toBeUndefined();
    expect(session.post_stress_recorded).toBeFalse();
    expect(session.duration_seconds).toBe(120);
    expect(summarizeSessionStress([session]).averageReduction).toBeNull();
  });

  test('a seed or previous rating is not explicit merely because it is numeric', async () => {
    const started = await startSession({ exerciseId: 'breathing', preStressLevel: 8 });
    await completeSession({ sessionId: started.data!.id, durationSeconds: 120, postStressLevel: 5 });
    expect(summarizeSessionStress(await listSessions())).toEqual({ averagePostStress: 5, averageReduction: null });
  });

  test('invalid explicit values cannot corrupt a saved response', async () => {
    expect((await startSession({ exerciseId: 'breathing', preStressLevel: 11, preStressRecorded: true })).error).not.toBeNull();
    const started = await startSession({ exerciseId: 'breathing', preStressLevel: 5, preStressRecorded: true });
    await completeSession({ sessionId: started.data!.id, durationSeconds: 60, postStressLevel: 3 });
    for (const invalid of [0, 11, 2.5, NaN]) {
      expect((await completeSession({ sessionId: started.data!.id, durationSeconds: 60, postStressLevel: invalid })).error).not.toBeNull();
    }
    expect((await listSessions()).find((s) => s.id === started.data!.id)?.post_stress_level).toBe(3);
  });
});

describe('feedback and statistics', () => {
  test('no claim before checkout, or when the initial rating is missing', () => {
    expect(describeStressChange(8, null).title).toBe('No comparison yet');
    expect(describeStressChange(null, 5).title).toBe('No comparison yet');
  });

  test('improvement, stability and worsening describe the actual reports', () => {
    expect(describeStressChange(7, 3)).toEqual({ title: '−4 points', message: 'You rated your stress lower after this practice (7/10 → 3/10).' });
    expect(describeStressChange(5, 5).title).toBe('Stress unchanged');
    expect(describeStressChange(3, 7).title).toBe('+4 points');
    expect(describeStressChange(5, 4).title).toBe('−1 point');
  });

  test('one shared scale includes both endpoints and an intermediate selection', () => {
    expect(STRESS_OPTIONS.map((option) => option.value)).toEqual([1, 3, 5, 7, 10]);
    expect(STRESS_OPTIONS.every((option) => option.label && option.description)).toBeTrue();
  });

  test('averages include unchanged and worsened responses, excluding missing, legacy and incomplete ones', () => {
    const session = (pre: number, post?: number): Session => ({ id: 'test', user_id: 'local', exercise_id: 'breathing', started_at: '2026-01-01', created_at: '2026-01-01', completed_at: '2026-01-01', duration_seconds: 120, pre_stress_level: pre, post_stress_level: post, pre_stress_recorded: true, post_stress_recorded: post !== undefined });
    const sessions = [session(7, 3), session(5, 5), session(3, 7), session(10), { ...session(8, 5), pre_stress_recorded: false, post_stress_recorded: false }, { ...session(10, 1), completed_at: undefined }];
    expect(summarizeSessionStress(sessions)).toEqual({ averagePostStress: 5, averageReduction: 0 });
    expect(summarizeSessionStress([session(3, 7)]).averageReduction).toBe(-4);
  });
});
