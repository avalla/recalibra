import type { Exercise } from "../types";

type RawExerciseRow = {
  id: string;
  name: string;
  description: string;
  category: Exercise["category"];
  level: Exercise["level"];
  duration_minutes: number;
  image_url: string | null;
  instructions: string;
  safety_warning: string | null;
  is_premium: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  audio_preset: Exercise["audio_preset"];
  origin: Exercise["origin"] | null;
  breathing_pattern: string | null;
  history: string | null;
  benefits: string | null;
  tips: string | null;
};

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeJsonParseOptional<T>(raw: string | null): T | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

const rawRows = require('./exercises_rows.json') as RawExerciseRow[];

export const seedExercises: Exercise[] = rawRows.map((row): Exercise => {
  const instructions = safeJsonParse<Exercise['instructions']>(row.instructions, []);
  const breathingPattern = safeJsonParseOptional<NonNullable<Exercise['breathing_pattern']>>(row.breathing_pattern);
  const benefits = safeJsonParseOptional<string[]>(row.benefits);
  const tips = safeJsonParseOptional<string[]>(row.tips);

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    level: row.level,
    duration_minutes: row.duration_minutes,
    image_url: row.image_url ?? undefined,
    instructions,
    safety_warning: row.safety_warning ?? undefined,
    audio_preset: row.audio_preset,
    origin: row.origin ?? undefined,
    is_premium: row.is_premium,
    is_active: row.is_active,
    breathing_pattern: breathingPattern,
    history: row.history ?? undefined,
    benefits,
    tips,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
});
