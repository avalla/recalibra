import { FREE_AUDIO_PRESETS, FREE_EXERCISE_SLUGS } from './constants';

export function isExerciseFree(exerciseSlug: string, isPremiumFlag?: boolean) {
  if (isPremiumFlag === true) return false;
  if (isPremiumFlag === false) return true;

  return (FREE_EXERCISE_SLUGS as readonly string[]).includes(exerciseSlug);
}

export function isAudioFree(audioPresetId: string) {
  return (FREE_AUDIO_PRESETS as readonly string[]).includes(audioPresetId);
}

export function canAccessExercise(
  isPremium: boolean,
  exerciseSlug: string,
  isPremiumFlag?: boolean
) {
  if (isPremium) return true;

  return isExerciseFree(exerciseSlug, isPremiumFlag);
}

export function canAccessAudio(isPremium: boolean, audioPresetId: string) {
  if (isPremium) return true;
  return isAudioFree(audioPresetId);
}
