import { expect, test } from 'bun:test';
import { seedExercises } from '../apps/mobile/src/data/exercises';
import { getExercisePlan } from '../apps/mobile/src/data/exercise-guidance';

const eyeYoga = seedExercises.find((exercise) => exercise.slug === 'eye-yoga');

test('eye yoga content is movement-focused rather than stale breathing copy', () => {
  expect(eyeYoga).toBeDefined();
  expect(eyeYoga?.history).not.toContain('breathing');
  expect(eyeYoga?.history).toContain('eye-movement');
});

test('eye yoga exposes a generic automatic guided plan', () => {
  expect(eyeYoga).toBeDefined();
  const plan = getExercisePlan(eyeYoga!);
  expect(plan.mode).toBe('automatic');
  expect(plan.steps.map((step) => step.id)).toEqual(['prepare', 'up-down', 'left-right', 'diagonals', 'circles', 'rest']);
});
