import { describe, expect, test } from 'bun:test';
import type { Journey, JourneyProgress } from '../apps/mobile/src/types';
import { getJourneyChapterState, getJourneyCompletion, getJourneyDurationMinutes } from '../apps/mobile/src/utils/journey-ui';

const journey: Journey = {
  id: 'journey',
  version: 1,
  slug: 'journey',
  title: 'Journey',
  description: 'Fixture',
  chapters: [
    { id: 'one', title: 'One', order: 1, steps: [{ id: 'one-step', exerciseId: 'one-exercise', title: 'One step', order: 1 }] },
    { id: 'two', title: 'Two', order: 2, steps: [{ id: 'two-step', exerciseId: 'two-exercise', title: 'Two step', order: 1 }] },
  ],
};

const progress: JourneyProgress = {
  journeyId: journey.id,
  journeyVersion: journey.version,
  status: 'in_progress',
  currentChapterId: 'two',
  currentStepId: 'two-step',
  updatedAt: '2026-01-01',
  completedStepIds: ['one-step'],
};

describe('Journey timeline state', () => {
  test('exposes completed, current and locked chapters from stable progress IDs', () => {
    expect(getJourneyChapterState(journey, journey.chapters[0], progress)).toBe('completed');
    expect(getJourneyChapterState(journey, journey.chapters[1], progress)).toBe('current');
    expect(getJourneyChapterState(journey, journey.chapters[1], null)).toBe('locked');
  });

  test('counts completion without exceeding the static step total', () => {
    expect(getJourneyCompletion(journey, progress)).toEqual({ completed: 1, total: 2 });
    expect(getJourneyCompletion(journey, { ...progress, completedStepIds: ['one-step', 'two-step', 'unknown'] })).toEqual({ completed: 2, total: 2 });
  });

  test('derives the total duration from the canonical exercise catalog', () => {
    expect(getJourneyDurationMinutes(journey, [
      { id: 'one-exercise', duration_minutes: 3 },
      { id: 'two-exercise', duration_minutes: 7 },
    ])).toBe(10);
  });
});
