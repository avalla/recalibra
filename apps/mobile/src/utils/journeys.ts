import type { Chapter, Journey, JourneyStep } from '../types';

export function orderedChapters(journey: Journey): readonly Chapter[] {
  return [...journey.chapters].sort((left, right) => left.order - right.order);
}

export function orderedJourneySteps(journey: Journey): readonly JourneyStep[] {
  return orderedChapters(journey).flatMap((chapter) =>
    [...chapter.steps].sort((left, right) => left.order - right.order),
  );
}

/**
 * Validates the invariants needed for deterministic resume.
 * Exercise IDs are unique within a Journey so a completed exercise can never
 * ambiguously identify two different steps.
 */
export function validateJourney(journey: Journey): void {
  if (!journey.id || !journey.slug || journey.version < 1) {
    throw new Error('Journey must have a stable id, slug and positive version.');
  }
  if (journey.chapters.length === 0) {
    throw new Error(`Journey ${journey.id} must contain at least one chapter.`);
  }

  const chapterIds = new Set<string>();
  const chapterOrders = new Set<number>();
  const stepIds = new Set<string>();
  const exerciseIds = new Set<string>();

  for (const chapter of journey.chapters) {
    if (!chapter.id || chapterIds.has(chapter.id)) {
      throw new Error(`Journey ${journey.id} contains a duplicate chapter id.`);
    }
    if (chapterOrders.has(chapter.order)) {
      throw new Error(`Journey ${journey.id} contains duplicate chapter order ${chapter.order}.`);
    }
    chapterIds.add(chapter.id);
    chapterOrders.add(chapter.order);

    if (chapter.steps.length === 0) {
      throw new Error(`Chapter ${chapter.id} must contain at least one step.`);
    }

    const stepOrders = new Set<number>();
    for (const step of chapter.steps) {
      if (!step.id || stepIds.has(step.id)) {
        throw new Error(`Journey ${journey.id} contains a duplicate step id.`);
      }
      if (!step.exerciseId || exerciseIds.has(step.exerciseId)) {
        throw new Error(`Journey ${journey.id} contains a duplicate exercise id.`);
      }
      if (stepOrders.has(step.order)) {
        throw new Error(`Chapter ${chapter.id} contains duplicate step order ${step.order}.`);
      }
      stepIds.add(step.id);
      exerciseIds.add(step.exerciseId);
      stepOrders.add(step.order);
    }
  }
}

export function getJourneyStep(journey: Journey, stepId: string): JourneyStep | undefined {
  return orderedJourneySteps(journey).find((step) => step.id === stepId);
}
