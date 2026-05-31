/**
 * Registry mapping an exercise slug to a bundled Lottie animation.
 *
 * The animation system degrades gracefully:
 *   1. a bespoke Lottie for the slug (this map), else
 *   2. a calm, category-based motion rendered in code (CategoryMotion), else
 *   3. the static ExerciseIllustration.
 *
 * To add a bespoke animation:
 *   1. `npx expo install lottie-react-native` (once) and rebuild the native app.
 *   2. Drop the file at `assets/animations/exercises/<slug>.json`.
 *   3. Add a line below, e.g.
 *        'eye-yoga': require('../../assets/animations/exercises/eye-yoga.json'),
 *
 * Until a slug has an entry here, it shows the in-code CategoryMotion, so the
 * feature is fully functional with no Lottie assets present.
 */
export const EXERCISE_LOTTIE: Record<string, number> = {
  // No bespoke Lottie assets yet. See the README in assets/animations/exercises.
};

export function getExerciseLottie(slug: string | undefined): number | undefined {
  if (!slug) return undefined;
  return EXERCISE_LOTTIE[slug];
}
