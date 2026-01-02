import type { Exercise } from "../types";

import { buildUniqueSlugs } from './slug';

type RawExerciseRow = {
  id: string;
  slug?: string;
  name: string;
  description: string;
  category: Exercise["category"];
  objective?: Exercise['objective'];
  level: Exercise["level"];
  duration_minutes: number;
  image_url: string | null;
  media: string | null;
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

function loadRawRows(): RawExerciseRow[] {
  const breathing = require('./exercises_seed_breathing.json') as RawExerciseRow[];
  const water = require('./exercises_seed_water.json') as RawExerciseRow[];
  const movement = require('./exercises_seed_movement.json') as RawExerciseRow[];
  const sensory = require('./exercises_seed_sensory.json') as RawExerciseRow[];
  return [...breathing, ...water, ...movement, ...sensory];
}

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

function inferObjective(input: {
  name: string;
  description: string;
  category: Exercise['category'];
  breathingPattern?: NonNullable<Exercise['breathing_pattern']>;
}): Exercise['objective'] {
  const name = input.name.trim().toLowerCase();
  const description = input.description.trim().toLowerCase();
  const haystack = `${name} ${description}`;

  if (/(sleep|insomnia|bedtime|night)/.test(haystack)) return 'sleep';
  if (/(focus|concentration|study|clarity|attention)/.test(haystack)) return 'focus';
  if (/(energy|energ|boost|wake|berserker|power|ignite)/.test(haystack)) return 'energy';
  if (/(relax|calm|downshift|soothe|release|unwind|ground)/.test(haystack)) return 'relax';

  const special = input.breathingPattern?.special;
  if (special === 'wim_hof' || special === 'rapid' || special === 'holotropic') return 'energy';
  if (special === 'humming') return 'relax';

  if (input.category === 'movement') return 'energy';
  if (input.category === 'sensory') return 'relax';
  if (input.category === 'water') return 'energy';

  return 'relax';
}

const rawRows = loadRawRows();
const slugsById = buildUniqueSlugs(rawRows.map((row) => ({ id: row.id, name: row.name })));

export const seedExercises: Exercise[] = rawRows.map((row): Exercise => {
  const instructions = safeJsonParse<Exercise['instructions']>(row.instructions, []);
  const breathingPattern = safeJsonParseOptional<NonNullable<Exercise['breathing_pattern']>>(row.breathing_pattern);
  const benefits = safeJsonParseOptional<string[]>(row.benefits);
  const tips = safeJsonParseOptional<string[]>(row.tips);
  const media = safeJsonParseOptional<NonNullable<Exercise['media']>>(row.media);

  const slug = row.slug ?? slugsById[row.id] ?? 'exercise';
  const inferredObjective = inferObjective({
    name: row.name,
    description: row.description,
    category: row.category,
    breathingPattern,
  });

  return {
    id: row.id,
    slug,
    name: row.name,
    description: row.description,
    category: row.category,
    objective: row.objective ?? inferredObjective,
    level: row.level,
    duration_minutes: row.duration_minutes,
    image_url: row.image_url ?? undefined,
    media,
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
