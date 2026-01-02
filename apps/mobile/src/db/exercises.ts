import type { Exercise, ExerciseWithFavorite } from '../types';

import { getDb } from './db';

function nowIso(): string {
  return new Date().toISOString();
}

export async function getExercisesWithFavorites(): Promise<ExerciseWithFavorite[]> {
  const db = await getDb();

  const rows = await db.getAllAsync<{
    id: string;
    slug: string;
    name: string;
    description: string;
    category: string;
    objective: string;
    level: string;
    duration_minutes: number;
    image_url: string | null;
    media_json: string | null;
    instructions_json: string;
    safety_warning: string | null;
    audio_preset: string;
    origin: string | null;
    is_premium: number;
    is_active: number;
    breathing_pattern_json: string | null;
    history: string | null;
    benefits_json: string | null;
    tips_json: string | null;
    created_at: string;
    updated_at: string;
    is_favorite: number;
  }>(
    `SELECT e.*, CASE WHEN f.exercise_id IS NULL THEN 0 ELSE 1 END as is_favorite
     FROM exercises e
     LEFT JOIN favorites f ON f.exercise_id = e.id
     WHERE e.is_active = 1
     ORDER BY e.name ASC`
  );

  return rows.map((r): ExerciseWithFavorite => {
    const exercise: Exercise = {
      id: r.id,
      slug: r.slug,
      name: r.name,
      description: r.description,
      category: r.category as Exercise['category'],
      objective: r.objective as Exercise['objective'],
      level: r.level as Exercise['level'],
      duration_minutes: r.duration_minutes,
      image_url: r.image_url ?? undefined,
      media: r.media_json ? (JSON.parse(r.media_json) as Exercise['media']) : undefined,
      instructions: JSON.parse(r.instructions_json) as Exercise['instructions'],
      safety_warning: r.safety_warning ?? undefined,
      audio_preset: r.audio_preset as Exercise['audio_preset'],
      origin: (r.origin ?? undefined) as Exercise['origin'],
      is_premium: r.is_premium === 1,
      is_active: r.is_active === 1,
      breathing_pattern: r.breathing_pattern_json
        ? (JSON.parse(r.breathing_pattern_json) as Exercise['breathing_pattern'])
        : undefined,
      history: r.history ?? undefined,
      benefits: r.benefits_json ? (JSON.parse(r.benefits_json) as Exercise['benefits']) : undefined,
      tips: r.tips_json ? (JSON.parse(r.tips_json) as Exercise['tips']) : undefined,
      created_at: r.created_at,
      updated_at: r.updated_at,
    };

    return {
      ...exercise,
      is_favorite: r.is_favorite === 1,
    };
  });
}

export async function toggleFavorite(exerciseId: string, nextIsFavorite: boolean): Promise<void> {
  const db = await getDb();
  if (nextIsFavorite) {
    await db.runAsync('INSERT OR IGNORE INTO favorites (exercise_id, created_at) VALUES (?, ?)', [
      exerciseId,
      nowIso(),
    ]);
  } else {
    await db.runAsync('DELETE FROM favorites WHERE exercise_id = ?', [exerciseId]);
  }
}
