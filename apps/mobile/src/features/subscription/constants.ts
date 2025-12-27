import type { PremiumFeature } from './types';

export const PREMIUM_FEATURES: PremiumFeature[] = [
  { icon: '🌍', title: 'All Traditions', description: '8 cultural breathing traditions' },
  { icon: '🎵', title: 'All Audio', description: '19 ambient sounds & frequencies' },
  { icon: '📊', title: 'Advanced Stats', description: 'Detailed progress tracking' },
  { icon: '🎯', title: 'AI Recommendations', description: 'Personalized exercise suggestions' },
  { icon: '📴', title: 'Offline Mode', description: 'Practice without internet' },
  { icon: '🔔', title: 'Custom Reminders', description: 'Unlimited reminder settings' },
];

export const FREE_EXERCISE_NAMES = [
  'Box Breathing',
  '4-7-8 Breathing',
  'Diaphragmatic Breathing',
  'Resonant Breathing',
  'Physiological Sigh',
];

export const FREE_AUDIO_PRESETS = ['silence', 'nature_rain', 'binaural_alpha'] as const;
