import type { Ionicons } from '@expo/vector-icons';

import type { ExerciseObjective, ExerciseWithFavorite } from '../types';

/**
 * Feeling-first selection engine.
 *
 * The user picks how they feel (in their own words); that fixes a target
 * `objective` and seeds the pre-session stress level. A single ranking
 * function then commits to one recommended practice (plus a couple of
 * alternates), replacing the catalog's hard-filter wizard and unifying the
 * logic that Home and quick-start used to duplicate.
 */

export type FeelingId = 'wired' | 'unsettled' | 'foggy' | 'drained';

export interface Feeling {
  id: FeelingId;
  label: string;
  caption: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Accent used only for the small state icon, not the surface. */
  color: string;
  objective: ExerciseObjective;
  /** Pre-session stress this feeling implies (1..10), captured once at entry. */
  seedStress: number;
}

export const FEELINGS: Feeling[] = [
  {
    id: 'wired',
    label: 'Wired or anxious',
    caption: 'Racing, tense, on edge',
    icon: 'pulse-outline',
    color: '#4ECDC4',
    objective: 'relax',
    seedStress: 8,
  },
  {
    id: 'unsettled',
    label: "Can't switch off",
    caption: "Mind won't quiet down",
    icon: 'cloudy-night-outline',
    color: '#A78BFA',
    objective: 'relax',
    seedStress: 7,
  },
  {
    id: 'foggy',
    label: 'Foggy or unfocused',
    caption: 'Scattered, hard to concentrate',
    icon: 'cloud-outline',
    color: '#60A5FA',
    objective: 'focus',
    seedStress: 5,
  },
  {
    id: 'drained',
    label: 'Drained or low',
    caption: 'Flat, running on empty',
    icon: 'battery-half-outline',
    color: '#F59E0B',
    objective: 'energy',
    seedStress: 4,
  },
];

export function getFeeling(id: FeelingId): Feeling {
  return FEELINGS.find((f) => f.id === id) ?? FEELINGS[0];
}

const WHY_LINES: Record<ExerciseObjective, string> = {
  relax: 'A long, slow exhale to downshift your nervous system.',
  energy: 'Brisk breathing to lift your state and clear the fog.',
  focus: 'Steady, even breaths to settle your attention.',
  sleep: 'A slow wind-down to ready your body for rest.',
};

export function whyLineForObjective(objective: ExerciseObjective): string {
  return WHY_LINES[objective] ?? WHY_LINES.relax;
}

export interface RecommendationInput {
  exercises: ExerciseWithFavorite[];
  objective: ExerciseObjective;
  /** Minutes the user says they have (soft target, e.g. 2 / 5 / 10). */
  minutesAvailable: number;
  now: Date;
  /** Most recent pre/post stress, used to bias modality when known. */
  lastStress?: number;
  /** Exercise ids to deprioritize for variety (e.g. the last one done). */
  excludeIds?: string[];
}

function timeOfDay(now: Date): { isMorning: boolean; isEvening: boolean } {
  const hour = now.getHours();
  return {
    isMorning: hour >= 5 && hour < 11,
    isEvening: hour >= 18 || hour < 5,
  };
}

function scoreExercise(exercise: ExerciseWithFavorite, input: RecommendationInput): number {
  const { objective, minutesAvailable, lastStress } = input;
  const { isMorning, isEvening } = timeOfDay(input.now);
  let score = 0;

  // Objective match is the dominant signal: the feeling is what the user told us.
  if (exercise.objective === objective) score += 12;

  // Fit the time budget: prefer practices that fit without overrunning it.
  const dur = exercise.duration_minutes;
  if (dur <= minutesAvailable) {
    score += 6 - (minutesAvailable - dur) * 0.8;
  } else {
    score -= (dur - minutesAvailable) * 3;
  }

  // Time of day nudges (sleep emerges in the evening rather than as a feeling).
  if (isEvening) {
    if (exercise.objective === 'sleep') score += 5;
    if (exercise.objective === 'relax') score += 2;
    if (exercise.objective === 'energy') score -= 4;
  }
  if (isMorning) {
    if (exercise.objective === 'energy') score += 3;
    if (exercise.objective === 'sleep') score -= 4;
  }

  // When the user is clearly activated, breath/sensory regulate faster.
  if (typeof lastStress === 'number' && lastStress >= 7) {
    if (exercise.category === 'breathing') score += 3;
    if (exercise.category === 'sensory') score += 1;
    if (exercise.category === 'movement') score -= 1;
  }

  if (exercise.is_favorite) score += 2;
  if (exercise.is_premium) score -= 1;
  if (input.excludeIds?.includes(exercise.id)) score -= 8;

  return score;
}

/** All active exercises, ranked best-first for the given feeling + time budget. */
export function getExerciseRecommendation(input: RecommendationInput): ExerciseWithFavorite[] {
  return input.exercises
    .filter((e) => e.is_active)
    .map((exercise) => ({ exercise, score: scoreExercise(exercise, input) }))
    .sort((a, b) => b.score - a.score)
    .map((s) => s.exercise);
}

export interface RecommendationSet {
  hero: ExerciseWithFavorite;
  alternates: ExerciseWithFavorite[];
}

/**
 * Commit to one practice plus up to `alternateCount` diverse alternates.
 * The hero is the best *accessible* pick (free users never hit a paywall on
 * the primary action); alternates favor a different modality and a shorter
 * option so the swaps feel meaningfully different.
 */
export function buildRecommendationSet(
  ranked: ExerciseWithFavorite[],
  options: { canAccess: (exercise: ExerciseWithFavorite) => boolean; alternateCount?: number }
): RecommendationSet | null {
  if (ranked.length === 0) return null;
  const alternateCount = options.alternateCount ?? 2;

  const hero = ranked.find((e) => options.canAccess(e)) ?? ranked[0];

  const alternates: ExerciseWithFavorite[] = [];
  const rest = ranked.filter((e) => e.id !== hero.id);

  // First alternate: a different modality if one exists.
  const differentModality = rest.find((e) => e.category !== hero.category);
  if (differentModality) alternates.push(differentModality);

  // Then fill, preferring a shorter "even quicker" option, avoiding dupes.
  const remaining = rest
    .filter((e) => !alternates.some((a) => a.id === e.id))
    .sort((a, b) => a.duration_minutes - b.duration_minutes);
  for (const exercise of remaining) {
    if (alternates.length >= alternateCount) break;
    alternates.push(exercise);
  }

  return { hero, alternates: alternates.slice(0, alternateCount) };
}
