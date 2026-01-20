import type { BreathingPattern, ExerciseCategory, ExerciseObjective } from '../types';

interface InferObjectiveInput {
  name: string;
  description: string;
  category: ExerciseCategory;
  breathingPattern?: BreathingPattern;
  breathingPatternJson?: string | null;
}

function parseBreathingPattern(json?: string | null): BreathingPattern | undefined {
  if (!json) return undefined;
  try {
    return JSON.parse(json) as BreathingPattern;
  } catch {
    return undefined;
  }
}

export function inferObjective(input: InferObjectiveInput): ExerciseObjective {
  const name = input.name.trim().toLowerCase();
  const description = input.description.trim().toLowerCase();
  const haystack = `${name} ${description}`;

  if (/(sleep|insomnia|bedtime|night)/.test(haystack)) return 'sleep';
  if (/(focus|concentration|study|clarity|attention)/.test(haystack)) return 'focus';
  if (/(energy|energ|boost|wake|berserker|power|ignite)/.test(haystack)) return 'energy';
  if (/(relax|calm|downshift|soothe|release|unwind|ground)/.test(haystack)) return 'relax';

  const breathingPattern = input.breathingPattern ?? parseBreathingPattern(input.breathingPatternJson);
  const special = breathingPattern?.special;
  if (special === 'wim_hof' || special === 'rapid' || special === 'holotropic') return 'energy';
  if (special === 'humming') return 'relax';

  if (input.category === 'movement') return 'energy';
  if (input.category === 'sensory') return 'relax';
  if (input.category === 'water') return 'energy';

  return 'relax';
}
