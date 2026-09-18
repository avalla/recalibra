# Journey Flow
> Seven-chapter local journey with session continuation

Entry: `apps/mobile/src/screens/home/HomeScreen.tsx`
Flow: Home card → `JourneyDetailScreen` → `JourneyRunnerScreen` → `ExerciseSessionScreen` → `PostSessionScreen`

Persistence: `apps/mobile/src/db/schema.ts` tables `journeys` + `journey_progress`
- Seeded by `apps/mobile/src/db/db.ts:ensureSeededJourneys()`
- Progress is next chapter index plus completed chapter IDs; stored as JSON for additive local migration
- Post-session save calls `apps/mobile/src/db/journeys.ts:completeJourneyChapter()` before navigating to the next runner

Definition: `apps/mobile/src/data/journeys.ts:returnToCenterJourney`
- Seven chapters reuse existing exercise slugs
- Missing slug falls back to the first loaded exercise in the runner

Updated: 2026-09-18
