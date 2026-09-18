import type { JourneyProgress } from '../types';
import { journeyDefinitions } from '../data/journeys';
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

export async function getJourneyProgress(journeyId: string): Promise<JourneyProgress> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    journey_id: string;
    current_chapter: number;
    completed_chapters_json: string;
    last_started_at: string | null;
    completed_at: string | null;
    updated_at: string;
  }>('SELECT * FROM journey_progress WHERE journey_id = ?', [journeyId]);

  if (row) {
    return {
      journeyId: row.journey_id,
      currentChapter: row.current_chapter,
      completedChapterIds: parseCompleted(row.completed_chapters_json),
      lastStartedAt: row.last_started_at ?? undefined,
      completedAt: row.completed_at ?? undefined,
      updatedAt: row.updated_at,
    };
  }

  const now = nowIso();
  await db.runAsync(
    `INSERT INTO journey_progress
      (journey_id, current_chapter, completed_chapters_json, updated_at)
     VALUES (?, 0, '[]', ?)`,
    [journeyId, now]
  );

  return { journeyId, currentChapter: 0, completedChapterIds: [], updatedAt: now };
}

export async function startJourney(journeyId: string): Promise<JourneyProgress> {
  const progress = await getJourneyProgress(journeyId);
  const startedAt = progress.lastStartedAt ?? nowIso();
  const updatedAt = nowIso();
  const db = await getDb();
  await db.runAsync(
    'UPDATE journey_progress SET last_started_at = ?, updated_at = ? WHERE journey_id = ?',
    [startedAt, updatedAt, journeyId]
  );
  return { ...progress, lastStartedAt: startedAt, updatedAt };
}

export async function completeJourneyChapter(
  journeyId: string,
  chapterIndex: number
): Promise<JourneyProgress> {
  const journey = journeyDefinitions.find((item) => item.id === journeyId);
  if (!journey || chapterIndex < 0 || chapterIndex >= journey.chapters.length) {
    throw new Error('Journey chapter is not valid');
  }

  const progress = await getJourneyProgress(journeyId);
  if (chapterIndex > progress.currentChapter && progress.currentChapter < journey.chapters.length) {
    throw new Error('Journey chapter is locked');
  }
  const chapterId = journey.chapters[chapterIndex].id;
  const completedChapterIds = progress.completedChapterIds.includes(chapterId)
    ? progress.completedChapterIds
    : [...progress.completedChapterIds, chapterId];
  const currentChapter = Math.min(
    journey.chapters.length,
    Math.max(progress.currentChapter, chapterIndex + 1)
  );
  const completedAt = currentChapter === journey.chapters.length ? nowIso() : progress.completedAt;
  const updatedAt = nowIso();
  const db = await getDb();

  await db.runAsync(
    `UPDATE journey_progress
     SET current_chapter = ?, completed_chapters_json = ?, completed_at = ?, updated_at = ?
     WHERE journey_id = ?`,
    [currentChapter, JSON.stringify(completedChapterIds), completedAt ?? null, updatedAt, journeyId]
  );

  return {
    ...progress,
    currentChapter,
    completedChapterIds,
    completedAt: completedAt ?? undefined,
    updatedAt,
  };
}
