import type { JourneyProgress, Session, SessionWithExercise } from '../types';
import { getDb } from './db';
import { isStressRating } from '../utils/stress-rating';

function nowIso(): string {
  return new Date().toISOString();
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export async function listSessions(limit = 20): Promise<SessionWithExercise[]> {
  const db = await getDb();

  const rows = await db.getAllAsync<{
    id: string;
    user_id: string | null;
    exercise_id: string;
    started_at: string;
    completed_at: string | null;
    duration_seconds: number;
    pre_stress_level: number | null;
    post_stress_level: number | null;
    pre_stress_recorded: number;
    post_stress_recorded: number;
    notes: string | null;
    journey_id: string | null;
    journey_step_id: string | null;
    created_at: string;
    exercise_name: string;
    exercise_category: string;
    exercise_duration_minutes: number;
  }>(
    `SELECT s.*, e.name as exercise_name, e.category as exercise_category, e.duration_minutes as exercise_duration_minutes
     FROM sessions s
     JOIN exercises e ON e.id = s.exercise_id
     ORDER BY s.started_at DESC
     LIMIT ?`,
    [limit]
  );

  return rows.map((r): SessionWithExercise => ({
    id: r.id,
    user_id: r.user_id ?? 'local',
    exercise_id: r.exercise_id,
    started_at: r.started_at,
    completed_at: r.completed_at ?? undefined,
    duration_seconds: r.duration_seconds,
    pre_stress_level: r.pre_stress_level,
    post_stress_level: r.post_stress_level ?? undefined,
    pre_stress_recorded: r.pre_stress_recorded === 1,
    post_stress_recorded: r.post_stress_recorded === 1,
    notes: r.notes ?? undefined,
    journey_id: r.journey_id ?? undefined,
    journey_step_id: r.journey_step_id ?? undefined,
    created_at: r.created_at,
    exercise: {
      name: r.exercise_name,
      category: r.exercise_category as any,
      duration_minutes: r.exercise_duration_minutes,
    },
  }));
}

export async function startSession(input: {
  exerciseId: string;
  preStressLevel: number | null;
  preStressRecorded?: boolean;
}): Promise<{ data: Session | null; error: Error | null }> {
  try {
    if (input.preStressRecorded && !isStressRating(input.preStressLevel)) {
      throw new Error('Choose a stress rating from 1 to 10.');
    }
    const db = await getDb();

    const now = nowIso();
    const id = generateId();

    await db.runAsync(
      `INSERT INTO sessions (
        id, exercise_id, started_at, completed_at, duration_seconds,
        pre_stress_level, post_stress_level, notes, created_at, pre_stress_recorded
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, input.exerciseId, now, null, 0, input.preStressLevel, null, null, now, input.preStressRecorded ? 1 : 0]
    );

    const session: Session = {
      id,
      user_id: 'local',
      exercise_id: input.exerciseId,
      started_at: now,
      duration_seconds: 0,
      pre_stress_level: input.preStressLevel,
      pre_stress_recorded: input.preStressRecorded === true,
      post_stress_recorded: false,
      created_at: now,
    };

    return { data: session, error: null };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

export async function updateSessionStatus(_input: {
  sessionId: string;
  status: 'started' | 'completed' | 'abandoned' | 'paused';
  durationSeconds?: number;
}): Promise<{ error: Error | null }> {
  try {
    const db = await getDb();
    if (typeof _input.durationSeconds === 'number') {
      await db.runAsync('UPDATE sessions SET duration_seconds = ? WHERE id = ?', [
        Math.max(0, Math.floor(_input.durationSeconds)),
        _input.sessionId,
      ]);
    }
    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
}

export async function completeSession(input: {
  sessionId: string;
  durationSeconds: number;
  postStressLevel: number | null;
  notes?: string;
}): Promise<{ error: Error | null }> {
  try {
    if (input.postStressLevel !== null && !isStressRating(input.postStressLevel)) {
      throw new Error('Choose a stress rating from 1 to 10, or skip the rating.');
    }
    const db = await getDb();
    const result = await db.runAsync(
      'UPDATE sessions SET completed_at = ?, duration_seconds = ?, post_stress_level = ?, post_stress_recorded = ?, notes = ? WHERE id = ?',
      [nowIso(), Math.max(0, Math.floor(input.durationSeconds)), input.postStressLevel, input.postStressLevel === null ? 0 : 1, input.notes ?? null, input.sessionId]
    );
    if (result.changes !== 1) {
      throw new Error('Session completion did not update exactly one session');
    }
    return { error: null };
  } catch (err) {
    return { error: err as Error };
  }
}
