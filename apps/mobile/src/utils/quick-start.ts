import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Exercise, ExerciseWithFavorite, AudioPreset } from '../types';

export type QuickStartMode = 'standard_2min' | 'favorite' | 'smart';

export interface QuickStartPreference {
  mode: QuickStartMode;
  favoriteExerciseId?: string;
}

export interface QuickStartContext {
  now: Date;
  lastStressLevel?: number;
}

export interface ExerciseSessionParams {
  exerciseId: string;
  exerciseName: string;
  durationMinutes: number;
  audioPreset: AudioPreset | string;
  exerciseCategory?: 'breathing' | 'water' | 'movement' | 'sensory';
  breathingPattern?: Exercise['breathing_pattern'];
  origin?: Exercise['origin'];
  history?: Exercise['history'];
  benefits?: Exercise['benefits'];
  tips?: Exercise['tips'];
  instructions?: Exercise['instructions'];
}

const QUICK_START_KEY = '@recalibra:quick_start_preference';

export async function loadQuickStartPreference(): Promise<QuickStartPreference | null> {
  const raw = await AsyncStorage.getItem(QUICK_START_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as QuickStartPreference;
    if (parsed?.mode !== 'standard_2min' && parsed?.mode !== 'favorite' && parsed?.mode !== 'smart') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveQuickStartPreference(preference: QuickStartPreference): Promise<void> {
  await AsyncStorage.setItem(QUICK_START_KEY, JSON.stringify(preference));
}

export async function clearQuickStartPreference(): Promise<void> {
  await AsyncStorage.removeItem(QUICK_START_KEY);
}

function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

function pickStandard2MinExercise(
  exercises: ExerciseWithFavorite[],
  context: QuickStartContext
): ExerciseWithFavorite | undefined {
  const exact2 = exercises.filter((e) => e.is_active && e.duration_minutes === 2);
  if (exact2.length > 0) {
    const dayKey = context.now.toISOString().slice(0, 10);
    const index =
      [...dayKey].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % exact2.length;
    return exact2[index];
  }

  const under3 = exercises
    .filter((e) => e.is_active && e.duration_minutes <= 3)
    .sort((a, b) => a.duration_minutes - b.duration_minutes);
  if (under3.length > 0) return under3[0];

  return exercises[0];
}

function pickFavoriteExercise(
  exercises: ExerciseWithFavorite[],
  favoriteExerciseId?: string
): ExerciseWithFavorite | undefined {
  if (favoriteExerciseId) {
    const byId = exercises.find((e) => e.id === favoriteExerciseId);
    if (byId) return byId;
  }

  const favorites = exercises.filter((e) => e.is_favorite);
  return favorites[0];
}

function scoreExerciseForSmartMode(exercise: ExerciseWithFavorite, context: QuickStartContext): number {
  const hour = context.now.getHours();
  const isMorning = hour >= 5 && hour < 11;
  const isEvening = hour >= 18 || hour < 5;
  const stress = context.lastStressLevel;

  let score = 0;

  const categoryScore: Record<NonNullable<ExerciseWithFavorite['category']>, number> = {
    breathing: 6,
    sensory: 4,
    movement: 3,
    water: 2,
  };

  score += categoryScore[exercise.category] ?? 0;

  if (typeof stress === 'number') {
    if (stress >= 7) {
      if (exercise.category === 'breathing') score += 8;
      if (exercise.category === 'sensory') score += 3;
      if (exercise.category === 'movement') score -= 2;
      if (exercise.category === 'water') score -= 1;
    } else if (stress <= 3) {
      if (exercise.category === 'movement') score += 5;
      if (exercise.category === 'breathing') score += 1;
    } else {
      if (exercise.category === 'breathing') score += 3;
      if (exercise.category === 'sensory') score += 2;
    }
  }

  if (isMorning) {
    if (exercise.category === 'movement') score += 3;
    if (exercise.category === 'breathing') score += 1;
  }

  if (isEvening) {
    if (exercise.category === 'breathing') score += 3;
    if (exercise.category === 'sensory') score += 2;
    if (exercise.category === 'movement') score -= 1;
  }

  if (exercise.objective === 'energy') {
    if (isMorning) score += 4;
    if (isEvening) score -= 4;
  }
  if (exercise.objective === 'relax') {
    if (isMorning) score -= 1;
    if (isEvening) score += 3;
  }
  if (exercise.objective === 'focus') {
    if (!isMorning && !isEvening) score += 3;
    if (isEvening) score -= 1;
  }
  if (exercise.objective === 'sleep') {
    if (isEvening) score += 5;
    if (!isEvening) score -= 4;
  }

  const name = normalizeText(exercise.name);
  if (name.includes('2-minute') || name.includes('2 min') || name.includes('2min')) score += 1;

  if (exercise.duration_minutes <= 5) score += 1;
  if (exercise.duration_minutes >= 15) score -= 2;

  if (exercise.is_favorite) score += 2;
  if (exercise.is_premium) score -= 1;

  return score;
}

function pickSmartExercise(exercises: ExerciseWithFavorite[], context: QuickStartContext): ExerciseWithFavorite | undefined {
  if (exercises.length === 0) return undefined;

  const sorted = [...exercises]
    .filter((e) => e.is_active)
    .sort((a, b) => scoreExerciseForSmartMode(b, context) - scoreExerciseForSmartMode(a, context));

  return sorted[0] ?? exercises[0];
}

export function getExerciseForQuickStart(
  preference: QuickStartPreference,
  exercises: ExerciseWithFavorite[],
  context: QuickStartContext
): ExerciseWithFavorite | undefined {
  if (exercises.length === 0) return undefined;

  switch (preference.mode) {
    case 'standard_2min':
      return pickStandard2MinExercise(exercises, context);
    case 'favorite':
      return pickFavoriteExercise(exercises, preference.favoriteExerciseId);
    case 'smart':
      return pickSmartExercise(exercises, context);
    default:
      return undefined;
  }
}

export function toExerciseSessionParams(exercise: ExerciseWithFavorite): ExerciseSessionParams {
  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    durationMinutes: exercise.duration_minutes,
    audioPreset: exercise.audio_preset || 'silence',
    exerciseCategory: exercise.category,
    breathingPattern: exercise.breathing_pattern,
    origin: exercise.origin,
    history: exercise.history,
    benefits: exercise.benefits,
    tips: exercise.tips,
    instructions: exercise.instructions,
  };
}
