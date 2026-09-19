import type { JourneyProgress } from '../types';
import { journeyDefinitions } from '../data/journeys';
import {
  completeJourneyProgress,
  createInitialJourneyProgress,
  normalizeJourneyProgress,
} from '../features/journeys/state';
import { getDb } from './db';

function nowIso(): string {
  return new Date().toISOString();
}

function parseCompleted(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every((value) => typeof value === 'string') ? parsed : [];
  } catch {
    return [];
  }
}

type Database = Awaited<ReturnType<typeof getDb>>;

function getJourney(journeyId: string) {
  const journey = journeyDefinitions.find((item) => item.id === journeyId);
  if (!journey) throw new Error('Journey is not valid');
  return journey;
}

async function readJourneyProgress(db: Database, journeyId: string): Promise<JourneyProgress> {
  const journey = getJourney(journeyId);
  const row = await db.getFirstAsync<{
    journey_id: string;
    current_chapter: number;
    completed_chapters_json: string;
    last_started_at: string | null;
    completed_at: string | null;
    updated_at: string;
  }>('SELECT * FROM journey_progress WHERE journey_id = ?', [journeyId]);

  if (!row) {
    const initial = createInitialJourneyProgress(journeyId, nowIso());
    await db.runAsync(
      `INSERT INTO journey_progress
        (journey_id, current_chapter, completed_chapters_json, updated_at)
       VALUES (?, 0, '[]', ?)`,
      [journeyId, initial.updatedAt]
    );
    return initial;
  }

  return normalizeJourneyProgress({
    journeyId: row.journey_id,
    currentChapter: row.current_chapter,
    completedChapterIds: parseCompleted(row.completed_chapters_json),
    lastStartedAt: row.last_started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    updatedAt: row.updated_at,
  }, journey);
}

async function writeJourneyProgress(db: Database, journeyId: string, progress: JourneyProgress): Promise<void> {
  await db.runAsync(
    `UPDATE journey_progress
     SET current_chapter = ?, completed_chapters_json = ?, completed_at = ?, updated_at = ?
     WHERE journey_id = ?`,
    [progress.currentChapter, JSON.stringify(progress.completedChapterIds), progress.completedAt ?? null, progress.updatedAt, journeyId]
  );
}

export async function getJourneyProgress(journeyId: string): Promise<JourneyProgress> {
  const db = await getDb();
  return readJourneyProgress(db, journeyId);
}

export async function startJourney(journeyId: string): Promise<JourneyProgress> {
  const db = await getDb();
  const progress = await readJourneyProgress(db, journeyId);
  const startedAt = progress.lastStartedAt ?? nowIso();
  const updatedAt = nowIso();
  await db.runAsync(
    `UPDATE journey_progress
     SET last_started_at = ?, current_chapter = ?, completed_chapters_json = ?, completed_at = ?, updated_at = ?
     WHERE journey_id = ?`,
    [startedAt, progress.currentChapter, JSON.stringify(progress.completedChapterIds), progress.completedAt ?? null, updatedAt, journeyId]
  );
  return { ...progress, lastStartedAt: startedAt, updatedAt };
}

export async function completeJourneyChapterInTransaction(
  db: Database,
  journeyId: string,
  chapterIndex: number,
  completionTimestamp = nowIso()
): Promise<JourneyProgress> {
  const journey = getJourney(journeyId);
  const progress = await readJourneyProgress(db, journeyId);
  const nextProgress = completeJourneyProgress(progress, journey, chapterIndex, completionTimestamp);
  await writeJourneyProgress(db, journeyId, nextProgress);
  return nextProgress;
}

export async function completeJourneyChapter(
  journeyId: string,
  chapterIndex: number
): Promise<JourneyProgress> {
  const db = await getDb();
  let nextProgress: JourneyProgress | null = null;
  await db.withTransactionAsync(async () => {
    nextProgress = await completeJourneyChapterInTransaction(db, journeyId, chapterIndex);
  });
  if (!nextProgress) throw new Error('Journey completion did not persist');
  return nextProgress;
}
