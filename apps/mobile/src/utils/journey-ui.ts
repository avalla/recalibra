import type { Chapter, Journey, JourneyProgress } from '../types';
import { orderedChapters, orderedJourneySteps } from './journeys';

export type JourneyChapterState = 'current' | 'completed' | 'locked';

export function getJourneyCompletion(journey: Journey, progress: JourneyProgress | null): { completed: number; total: number } {
  const total = orderedJourneySteps(journey).length;
  const completed = progress?.completedStepIds.length ?? 0;
  return { completed: Math.min(completed, total), total };
}

export function getJourneyChapterState(
  journey: Journey,
  chapter: Chapter,
  progress: JourneyProgress | null,
): JourneyChapterState {
  const completed = new Set(progress?.completedStepIds ?? []);
  if (chapter.steps.every((step) => completed.has(step.id))) return 'completed';

  const firstIncomplete = orderedJourneySteps(journey).find((step) => !completed.has(step.id));
  if (firstIncomplete && chapter.steps.some((step) => step.id === firstIncomplete.id)) return 'current';

  return 'locked';
}

export function getJourneyChapterIndex(journey: Journey, chapter: Chapter): number {
  return orderedChapters(journey).findIndex((candidate) => candidate.id === chapter.id) + 1;
}

export function getJourneyDurationMinutes(
  journey: Journey,
  exercises: ReadonlyArray<{ id: string; duration_minutes: number }>,
): number {
  const durations = new Map(exercises.map((exercise) => [exercise.id, exercise.duration_minutes]));
  return orderedJourneySteps(journey).reduce(
    (total, step) => total + (durations.get(step.exerciseId) ?? 0),
    0,
  );
}
