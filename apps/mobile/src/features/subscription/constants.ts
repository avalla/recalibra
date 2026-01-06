import type { PremiumFeature } from './types';

export const PREMIUM_FEATURES: PremiumFeature[] = [
  { icon: '🧘', title: 'More Exercises', description: 'Unlock the full catalog' },
  { icon: '🎧', title: 'Binaural Beats', description: 'Access binaural alpha/theta/delta' },
  { icon: '🎵', title: 'Premium Audio', description: 'More ambient sounds & tones' },
];

export const FREE_EXERCISE_SLUGS = [
  'box-breathing',
  '4-7-8-breathing',
  'diaphragmatic-breathing',
  'resonant-breathing',
  'physiological-sigh',
] as const;

export const FREE_AUDIO_PRESETS = ['silence', 'nature_rain', 'nature_ocean', 'tibetan_bowl'] as const;
