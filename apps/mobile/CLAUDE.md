# Recalibra Mobile — CLAUDE.md

Expo / React Native app. **Local-first** (expo-sqlite), anonymous auth, RevenueCat paywall.
Read the repo-root `CLAUDE.md` first for stack-wide rules. This file covers app internals.

## Entry & boot

- `index.ts` → `registerRootComponent(App)`.
- `App.tsx`: loads fonts (Poppins + DM Serif Display), runs `initializeApp()`, renders
  `ErrorBoundary > AuthProvider > NavigationContainer(RootNavigator)`. `enableScreens(false)`
  is intentional (avoids reanimated crashes). Default text props applied globally.
- `src/app/init.ts`: `initDb()` then `initializeRevenueCat()`. Init failures are swallowed so
  the app still loads (subscription features degrade gracefully).

## Directory map (`src/`)

```
app/          # boot: init.ts, theme.ts, default-text-props.ts
config/        # AppConfig (env keys, audio/session/health constants)
constants/     # theme, colors, gradients, backgrounds, app.ts constants
contexts/      # AuthContext (local anonymous user + device UUID, onboarding flag)
components/    # shared components + components/ui (base: Button, Input, Card, …)
features/      # domain modules: auth/ (local storage, keys, user-id), subscription/ (entitlement access)
db/            # SQLite: db.ts (open/seed/migrate), schema.ts, + per-table modules
data/          # seed data (exercises) + slug helpers
hooks/         # useExercises, useSessions, useGoals, useScreening, useSubscription,
               #   useAppleHealth, useAudio, useHaptics, useNotifications
navigation/    # Root / MainTab / Screening / Exercise navigators (type your route params)
screens/       # auth, screening, home, exercises, progress, profile, settings, subscription
types/         # shared TS types
utils/         # logger, errorHandler, cache, network, device, permissions, sessionManager, …
```

## Data layer (SQLite)

- DB file: `recalibra_v3.db`. Schema in `db/schema.ts`; tables: `exercises`, `favorites`,
  `sessions`, `goals`, `reminders`, `screening`.
- `db/db.ts` runs `SCHEMA_SQL`, then idempotent column/back-fill migrations
  (`ensure*Column`/`ensure*Backfill`) and seeds exercises + defaults on init. **Add new
  schema changes the same way** — additive, idempotent migrations that won't drop user data.
- Access tables through the typed modules (`db/exercises.ts`, `db/sessions.ts`, …), not raw
  SQL scattered in screens.

## Auth

Fully **local & anonymous**: `AuthContext` bootstraps a device-scoped user via
`getDeviceUUID()` + persisted credentials in `features/auth/`. There is no remote auth/login
server. Don't introduce one without an explicit request.

## Subscriptions (RevenueCat)

- Wiring is centralized in `lib/revenuecat.ts`; init once at boot.
- Gate premium features by **entitlement** (see `features/subscription/access.ts` and
  `constants.ts`), never by raw product/SKU IDs. RevenueCat is the source of truth.
- Show friendly errors; distinguish cancel / network / store / unexpected. Track only
  high-level events. Never log SDK keys or purchaser payloads.

## Conventions specific to this app

- Path aliases `@/components`, `@/screens`, `@/hooks`, `@/utils`, `@/lib`, `@/types`,
  `@/constants`, `@` → `src` (defined in `babel.config.js`).
- Business logic in hooks (`src/hooks/`), keep screens thin.
- Use `utils/logger.ts` (gated on `__DEV__`) rather than bare `console.*`.
- Use `expo-secure-store` for anything sensitive; `EXPO_PUBLIC_*` env for public keys
  (RevenueCat iOS/Android). See `.env.example`.
- Safety: surface warnings for water/ice/cold exercises.
- Typecheck with `bunx tsc --noEmit` from this directory before declaring done.
