import { describe, expect, test } from 'bun:test';
import type { ExerciseWithFavorite, Journey, JourneyProgress } from '../apps/mobile/src/types';
import { toNextJourneySessionParams } from '../apps/mobile/src/utils/journey-runner';

const journey: Journey = {
  id: 'journey',
  version: 1,
  slug: 'journey',
  title: 'Journey',
  description: 'Fixture',
  chapters: [{
    id: 'chapter',
    title: 'Chapter',
    order: 1,
    steps: [{ id: 'step-2', exerciseId: 'exercise-2', title: 'Next', order: 2 }],
  }],
};

const exercise = { id: 'exercise-2', name: 'Next exercise', duration_minutes: 2, audio_preset: 'silence', category: 'breathing', is_active: true, is_favorite: false } as ExerciseWithFavorite;
const progress: JourneyProgress = {
  journeyId: journey.id,
  journeyVersion: journey.version,
  status: 'in_progress',
  currentChapterId: 'chapter',
  currentStepId: 'step-2',
  updatedAt: '2026-01-01',
  completedStepIds: ['step-1'],
};

describe('Journey runner routing', () => {
  test('builds an optional next-session context from the persisted pointer', () => {
    expect(toNextJourneySessionParams(journey, progress, [exercise])).toMatchObject({
      exerciseId: 'exercise-2',
      journeyContext: { journeyId: 'journey', journeyVersion: 1, stepId: 'step-2' },
    });
  });

  test('returns no route when the journey is terminal or its exercise is unavailable', () => {
    expect(toNextJourneySessionParams(journey, { ...progress, status: 'completed', currentStepId: undefined }, [exercise])).toBeUndefined();
    expect(toNextJourneySessionParams(journey, progress, [])).toBeUndefined();
  });
});
