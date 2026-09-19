import type { SQLiteDatabase } from 'expo-sqlite';
import type { Journey, JourneyProgress, JourneyProgressStatus } from '../types';
import { getJourneyStep, orderedChapters, orderedJourneySteps, validateJourney } from '../utils/journeys';
import { getDb } from './db';

type JourneyDb = Pick<
  SQLiteDatabase,
  'getAllAsync' | 'getFirstAsync' | 'runAsync' | 'withTransactionAsync'
>;

type ProgressRow = {
  journey_id: string;
  journey_version: number;
  status: JourneyProgressStatus;
  current_chapter_id: string | null;
  current_step_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
};

type CompletionRow = { step_id: string };
function nowIso(): string {
  return new Date().toISOString();
}

function chapterForStep(journey: Journey, stepId: string): string | undefined {
  return orderedChapters(journey).find((chapter) => chapter.steps.some((step) => step.id === stepId))?.id;
}

function toProgress(row: ProgressRow, completedStepIds: readonly string[]): JourneyProgress {
  return {
    journeyId: row.journey_id,
    journeyVersion: row.journey_version,
    status: row.status,
    currentChapterId: row.current_chapter_id ?? undefined,
    currentStepId: row.current_step_id ?? undefined,
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    updatedAt: row.updated_at,
    completedStepIds,
  };
}

async function readProgress(db: JourneyDb, journeyId: string): Promise<JourneyProgress | null> {
  const row = await db.getFirstAsync<ProgressRow>('SELECT * FROM journey_progress WHERE journey_id = ?', [journeyId]);
  if (!row) return null;
  const completions = await db.getAllAsync<CompletionRow>(
    'SELECT step_id FROM journey_step_progress WHERE journey_id = ? ORDER BY completed_at ASC, step_id ASC',
    [journeyId],
  );
  return toProgress(row, completions.map((completion) => completion.step_id));
}

function assertVersion(progress: JourneyProgress, journey: Journey): void {
  if (progress.journeyVersion !== journey.version) {
    throw new Error(
      `Journey ${journey.id} content version ${journey.version} does not match saved progress version ${progress.journeyVersion}.`,
    );
  }
}

export async function getJourneyProgress(journeyId: string): Promise<JourneyProgress | null> {
  return readProgress(await getDb(), journeyId);
}

/** Creates the stable first-step pointer exactly once. */
export async function ensureJourneyProgress(journey: Journey): Promise<JourneyProgress> {
  validateJourney(journey);
  const firstStep = orderedJourneySteps(journey)[0];
  const firstChapterId = chapterForStep(journey, firstStep.id);
  if (!firstChapterId) throw new Error(`Step ${firstStep.id} has no parent chapter.`);

  const db = await getDb();
  const now = nowIso();
  await db.runAsync(
    `INSERT OR IGNORE INTO journey_progress (
      journey_id, journey_version, status, current_chapter_id, current_step_id,
      started_at, completed_at, updated_at
    ) VALUES (?, ?, 'not_started', ?, ?, NULL, NULL, ?)`,
    [journey.id, journey.version, firstChapterId, firstStep.id, now],
  );

  const progress = await readProgress(db, journey.id);
  if (!progress) throw new Error(`Could not create progress for Journey ${journey.id}.`);
  assertVersion(progress, journey);
  return progress;
}

export async function startJourney(journey: Journey): Promise<JourneyProgress> {
  const db = await getDb();
  const progress = await ensureJourneyProgress(journey);
  if (progress.status === 'not_started') {
    const now = nowIso();
    await db.runAsync(
      `UPDATE journey_progress
       SET status = 'in_progress', started_at = ?, updated_at = ?
       WHERE journey_id = ? AND status = 'not_started'`,
      [now, now, journey.id],
    );
  }
  return (await readProgress(db, journey.id))!;
}

/**
 * Completes one stable step and moves the resume pointer in the same SQLite
 * transaction. Repeating the same completion is idempotent; completing a
 * different step out of order is rejected.
 */
export async function completeJourneyStep(input: {
  journey: Journey;
  stepId: string;
  sessionId: string;
}): Promise<JourneyProgress> {
  const { journey, stepId, sessionId } = input;
  validateJourney(journey);
  const step = getJourneyStep(journey, stepId);
  if (!step) throw new Error(`Step ${stepId} does not belong to Journey ${journey.id}.`);

  const db = await getDb();
  const progress = await ensureJourneyProgress(journey);
  assertVersion(progress, journey);

  await db.withTransactionAsync(async () => {
    const existing = await db.getFirstAsync<{ session_id: string }>(
      'SELECT session_id FROM journey_step_progress WHERE journey_id = ? AND step_id = ?',
      [journey.id, stepId],
    );
    if (existing) {
      if (existing.session_id !== sessionId) {
        throw new Error(`Journey step ${stepId} is already linked to another session.`);
      }
      return;
    }

    const session = await db.getFirstAsync<{
      exercise_id: string;
      journey_id: string | null;
      journey_step_id: string | null;
    }>('SELECT exercise_id, journey_id, journey_step_id FROM sessions WHERE id = ?', [sessionId]);
    if (!session) throw new Error(`Session ${sessionId} does not exist.`);
    if (session.exercise_id !== step.exerciseId) {
      throw new Error(`Session ${sessionId} does not match Journey step ${stepId}.`);
    }
    if (
      (session.journey_id && session.journey_id !== journey.id) ||
      (session.journey_step_id && session.journey_step_id !== stepId)
    ) {
      throw new Error(`Session ${sessionId} is already linked to another Journey step.`);
    }
    if (progress.currentStepId !== stepId) {
      throw new Error(`Journey ${journey.id} expected step ${progress.currentStepId}, received ${stepId}.`);
    }

    await db.runAsync(
      'UPDATE sessions SET journey_id = ?, journey_step_id = ? WHERE id = ?',
      [journey.id, stepId, sessionId],
    );
    await db.runAsync(
      `INSERT INTO journey_step_progress (journey_id, step_id, session_id, completed_at)
       VALUES (?, ?, ?, ?)`,
      [journey.id, stepId, sessionId, nowIso()],
    );

    const sequence = orderedJourneySteps(journey);
    const nextStep = sequence[sequence.findIndex((candidate) => candidate.id === stepId) + 1];
    const now = nowIso();
    if (!nextStep) {
      await db.runAsync(
        `UPDATE journey_progress
         SET status = 'completed', current_chapter_id = NULL, current_step_id = NULL,
             started_at = COALESCE(started_at, ?),
             completed_at = ?, updated_at = ?
         WHERE journey_id = ?`,
        [now, now, now, journey.id],
      );
      return;
    }

    const nextChapterId = chapterForStep(journey, nextStep.id);
    if (!nextChapterId) throw new Error(`Step ${nextStep.id} has no parent chapter.`);
    await db.runAsync(
      `UPDATE journey_progress
       SET status = 'in_progress', current_chapter_id = ?, current_step_id = ?,
           started_at = COALESCE(started_at, ?), updated_at = ?
       WHERE journey_id = ?`,
      [nextChapterId, nextStep.id, now, now, journey.id],
    );
  });

  return (await readProgress(db, journey.id))!;
}
