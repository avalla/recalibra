import type { ExerciseWithFavorite, Journey, JourneyProgress, JourneyStep } from '../types';
import { getJourneyStep } from './journeys';
import { toExerciseSessionParams, type ExerciseSessionParams } from './quick-start';

export function getCurrentJourneyStep(journey: Journey, progress: JourneyProgress): JourneyStep | undefined {
  if (progress.status !== 'in_progress' || !progress.currentStepId) return undefined;
  return getJourneyStep(journey, progress.currentStepId);
}

/** Builds the next player route without changing ordinary exercise routing. */
export function toNextJourneySessionParams(
  journey: Journey,
  progress: JourneyProgress,
  exercises: readonly ExerciseWithFavorite[],
): (ExerciseSessionParams & { journeyContext: { journeyId: string; journeyVersion: number; stepId: string } }) | undefined {
  const step = getCurrentJourneyStep(journey, progress);
  if (!step) return undefined;

  const exercise = exercises.find((candidate) => candidate.id === step.exerciseId);
  if (!exercise) return undefined;

  return {
    ...toExerciseSessionParams(exercise),
    journeyContext: {
      journeyId: journey.id,
      journeyVersion: journey.version,
      stepId: step.id,
    },
  };
}
