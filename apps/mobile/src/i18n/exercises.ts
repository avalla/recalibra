import type { Exercise } from '../types';
import type { Language } from './language';
import { currentLanguage } from './core';
import en from './locales/exercises.en.json';
import it from './locales/exercises.it.json';

export type ExerciseText = Pick<Exercise, 'name' | 'description' | 'instructions' | 'safety_warning' | 'history' | 'benefits' | 'tips'>;
const catalogs: Record<Language, Record<string, Partial<ExerciseText>>> = { en, it };
export function exerciseText(id: string, fallback: Partial<ExerciseText>, language = currentLanguage()): Partial<ExerciseText> {
  return { ...fallback, ...catalogs.en[id], ...(language === 'it' ? catalogs.it[id] : {}) };
}
export function localizeExercise<T extends Exercise>(exercise: T, language = currentLanguage()): T {
  return { ...exercise, ...exerciseText(exercise.id, exercise, language) };
}
export const localizedExerciseName = (id: string, fallback: string, language = currentLanguage()) =>
  exerciseText(id, { name: fallback }, language).name ?? fallback;
