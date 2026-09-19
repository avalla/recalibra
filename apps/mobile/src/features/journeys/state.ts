import type { JourneyDefinition, JourneyProgress } from '../../types';

export function createInitialJourneyProgress(journeyId: string, updatedAt: string): JourneyProgress {
  return { journeyId, currentChapter: 0, completedChapterIds: [], updatedAt };
}

export function normalizeJourneyProgress(progress: JourneyProgress, journey: JourneyDefinition): JourneyProgress {
  const chapterIds = new Set(journey.chapters.map((chapter) => chapter.id));
  return {
    ...progress,
    currentChapter: Math.min(journey.chapters.length, Math.max(0, progress.currentChapter)),
    completedChapterIds: Array.from(new Set(progress.completedChapterIds)).filter((id) => chapterIds.has(id)),
  };
}

export function completeJourneyProgress(
  progress: JourneyProgress,
  journey: JourneyDefinition,
  chapterIndex: number,
  completedAt: string
): JourneyProgress {
  if (chapterIndex < 0 || chapterIndex >= journey.chapters.length) throw new Error('Journey chapter is not valid');
  const normalized = normalizeJourneyProgress(progress, journey);
  if (chapterIndex > normalized.currentChapter && normalized.currentChapter < journey.chapters.length) {
    throw new Error('Journey chapter is locked');
  }
  const chapterId = journey.chapters[chapterIndex].id;
  const completedChapterIds = Array.from(new Set([...normalized.completedChapterIds, chapterId]));
  const currentChapter = Math.min(journey.chapters.length, Math.max(normalized.currentChapter, chapterIndex + 1));
  return {
    ...normalized,
    currentChapter,
    completedChapterIds,
    completedAt: normalized.completedAt ?? (currentChapter === journey.chapters.length ? completedAt : undefined),
    updatedAt: completedAt,
  };
}

export function getJourneyEntryChapter(progress: JourneyProgress | null, chapterCount: number): number {
  if (!progress) return 0;
  return progress.currentChapter >= chapterCount ? 0 : progress.currentChapter;
}

export function getNextJourneyChapter(progress: JourneyProgress, chapterCount: number): number | null {
  return progress.currentChapter >= chapterCount ? null : progress.currentChapter;
}

export function findInvalidJourneyExerciseSlugs(definitions: JourneyDefinition[], exerciseSlugs: Iterable<string>): string[] {
  const availableSlugs = new Set(exerciseSlugs);
  return Array.from(new Set(definitions.flatMap((journey) =>
    journey.chapters.map((chapter) => chapter.exerciseSlug).filter((slug) => !availableSlugs.has(slug))
  )));
}
