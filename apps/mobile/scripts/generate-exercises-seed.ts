import { buildUniqueSlugs } from '../src/data/slug';

type RawExerciseRow = {
  id: string;
  name: string;
  description: string;
  category: string;
  level: string;
  duration_minutes: number;
  image_url: string | null;
  instructions: string;
  safety_warning: string | null;
  is_premium: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  audio_preset: string;
  origin: string | null;
  breathing_pattern: string | null;
  history: string | null;
  benefits: string | null;
  tips: string | null;
};

type SeedExerciseRow = RawExerciseRow & {
  slug: string;
  objective: 'relax' | 'energy' | 'focus' | 'sleep';
};

type ExerciseCategory = 'breathing' | 'water' | 'movement' | 'sensory';

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
  category: string;
  breathingPattern?: { special?: string };
}): SeedExerciseRow['objective'] {
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

async function main(): Promise<void> {
  const outBaseDir = new URL('../src/data', import.meta.url).pathname;

  const paths = {
    breathing: `${outBaseDir}/exercises_seed_breathing.json`,
    water: `${outBaseDir}/exercises_seed_water.json`,
    movement: `${outBaseDir}/exercises_seed_movement.json`,
    sensory: `${outBaseDir}/exercises_seed_sensory.json`,
  } satisfies Record<ExerciseCategory, string>;

  const rows: RawExerciseRow[] = [];
  for (const category of Object.keys(paths) as ExerciseCategory[]) {
    const text = await Bun.file(paths[category]).text();
    const parsed = JSON.parse(text) as RawExerciseRow[];
    rows.push(...parsed);
  }

  const slugsById = buildUniqueSlugs(rows.map((r) => ({ id: r.id, name: r.name })));

  const seedRows: SeedExerciseRow[] = rows.map((r) => {
    const breathingPattern = safeJsonParseOptional<{ special?: string }>(r.breathing_pattern);
    const objective = inferObjective({
      name: r.name,
      description: r.description,
      category: r.category,
      breathingPattern,
    });

    return {
      ...r,
      slug: slugsById[r.id] ?? 'exercise',
      objective,
    };
  });

  const byCategory: Record<ExerciseCategory, SeedExerciseRow[]> = {
    breathing: [],
    water: [],
    movement: [],
    sensory: [],
  };

  for (const row of seedRows) {
    const category = row.category as ExerciseCategory;
    if (!byCategory[category]) continue;
    byCategory[category].push(row);
  }

  const targets: Array<{ category: ExerciseCategory; path: string; count: number }> = [];
  for (const category of Object.keys(byCategory) as ExerciseCategory[]) {
    const outPath = paths[category];
    await Bun.write(outPath, JSON.stringify(byCategory[category]));
    targets.push({ category, path: outPath, count: byCategory[category].length });
  }

  // eslint-disable-next-line no-console
  console.log(`Wrote ${seedRows.length} exercises split by category:`);
  for (const t of targets) {
    // eslint-disable-next-line no-console
    console.log(`- ${t.category}: ${t.count} -> ${t.path}`);
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
