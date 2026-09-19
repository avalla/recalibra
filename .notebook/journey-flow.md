# Journey Flow
> Seven-chapter local journey with session continuation

Entry: `apps/mobile/src/screens/home/HomeScreen.tsx`
Flow: Home card → `JourneyDetailScreen` → `JourneyRunnerScreen` → `ExerciseSessionScreen` → `PostSessionScreen`

Persistence: `apps/mobile/src/db/schema.ts` tables `journeys` + `journey_progress`
- Seeded by `apps/mobile/src/db/db.ts:ensureSeededJourneys()`
- Progress is next chapter index plus completed chapter IDs; stored as JSON for additive local migration
- Post-session save uses the atomic `completeSessionAndJourney()` transaction; navigation follows the returned persisted progress

Definition: `apps/mobile/src/data/journeys.ts:returnToCenterJourney`
- Seven chapters reuse existing exercise slugs
- Missing slug fails closed in the runner; bundled slugs are validated against exercise seeds during DB init

Updated: 2026-09-19
