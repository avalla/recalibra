# Exercise demonstration animations (Lottie slots)

Drop bespoke Lottie animations here, one per exercise, named by **slug**:

```
assets/animations/exercises/<slug>.json
```

Then register it in `src/components/exercise-animations.ts`:

```ts
'eye-yoga': require('../../assets/animations/exercises/eye-yoga.json'),
```

## Activation steps (once)

1. `npx expo install lottie-react-native`
2. Rebuild the native app (EAS or dev client) — Lottie is a native module.
3. Add the `.json` files here and map them in the registry.

Until a slug is mapped, the app shows an in-code calm motion based on the
exercise category (`ExerciseAnimation` → `CategoryMotion`), so nothing breaks
and the screen is never empty.

## Priority slots (the gap: non-breathing exercises without a demo today)

Movement: `eye-yoga`, `five-tibetan-rites`, `legs-up-the-wall`, `lifting-the-sky`,
`capoeira-ginga-breath`, `body-scan`
Sensory: `ear-massage`, `eye-movement-exercise`, `grounding-moment`,
`body-scan-meditation`, `cold-exposure`
Water: `cold-water-facial-immersion`, `diving-reflex`, `gargling`, `mindful-drinking`

## Style guidance

Calm, slow, looping. Teal/category accent, dark background to match the app.
Keep them abstract and soothing (this is a vagus-nerve / stress app), not busy.
Target a small file size (vector only, no embedded rasters).
