import { expect, mock, test } from 'bun:test';
mock.module('@react-native-async-storage/async-storage', () => ({ default: {} }));
const { toExerciseSessionParams } = await import('../apps/mobile/src/utils/quick-start');
import { seedExercises } from '../apps/mobile/src/data/exercises';
import type { ExerciseWithFavorite } from '../apps/mobile/src/types';

test('the common home, quick-start and detail payload preserves canonical warnings and every protocol field', () => {
  for (const exercise of seedExercises) {
    const params = toExerciseSessionParams({ ...exercise, id: exercise.slug, is_favorite: false } as ExerciseWithFavorite);
    expect(params.safetyWarning).toBe(exercise.safety_warning);
    expect(params.breathingPattern).toEqual(exercise.breathing_pattern);
    expect(params.instructions).toEqual(exercise.instructions);
    expect(params.exerciseId).toBe(exercise.slug);
  }
});

test('no warning is synthesized when the canonical exercise has none', () => {
  const exercise = { ...seedExercises[0], safety_warning: undefined } as ExerciseWithFavorite;
  expect(toExerciseSessionParams(exercise).safetyWarning).toBeUndefined();
});
