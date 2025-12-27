import { FREE_AUDIO_PRESETS, FREE_EXERCISE_NAMES } from './constants';

export function isExerciseFree(exerciseName: string, isPremiumFlag?: boolean) {
  if (isPremiumFlag === false) return true;

  return FREE_EXERCISE_NAMES.some((name) =>
    exerciseName.toLowerCase().includes(name.toLowerCase())
  );
}

export function isAudioFree(audioPresetId: string) {
  return (FREE_AUDIO_PRESETS as readonly string[]).includes(audioPresetId);
}

export function canAccessExercise(isPremium: boolean, exerciseName: string, isPremiumFlag?: boolean) {
  if (isPremium) return true;
  return isExerciseFree(exerciseName, isPremiumFlag);
}

export function canAccessAudio(isPremium: boolean, audioPresetId: string) {
  if (isPremium) return true;
  return isAudioFree(audioPresetId);
}
