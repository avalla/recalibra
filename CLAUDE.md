# Recalibra — CLAUDE.md

Recalibra is a **vagus nerve stimulation / stress-management app**: guided breathing,
water/cold, vocal and movement exercises with pre/post stress tracking and progress trends.

**Status:** active testing, **not yet published**. Backward-compat is not a hard requirement,
but avoid needless breaking changes to **local user data**. Refactors are welcome when they
improve correctness and maintainability.

> ⚠️ Ground truth lives in the code, not in `.windsurf/rules/` or `docs/rules/`. The rules have
> been trimmed to match reality, but if they ever disagree with the code, the code wins. There is
> **no remote backend, no analytics SDK, and no job queue** — see "Reality check" below.

## Monorepo layout

```
apps/mobile/        # ← the product. Expo / React Native app (start here)
apps/web/           # marketing/landing site (Vite + React + Tailwind v4 + wouter)
mcp-servers/        # llm-router: standalone dev-time MCP server (LangChain) for seed enrichment
docs/               # EULA, privacy policy, store assets, exercises data, copies of rules
```

## Tech stack (actual)

- **Runtime/PM:** Bun (use `bun` / `bunx`, never npm/pnpm/yarn). Bun auto-loads `.env`.
- **Mobile:** Expo SDK 54, React Native 0.81, React 19, TypeScript strict.
- **Data:** **local-first**, `expo-sqlite` (`recalibra_v3.db`). No remote backend at runtime.
- **Navigation:** React Navigation (native-stack + bottom-tabs).
- **Subscriptions:** RevenueCat (`react-native-purchases`), gated by **entitlements**.
- **Health:** `react-native-health` (Apple Health).
- **Media/UX:** expo-audio, expo-video, expo-haptics, reanimated, svg, linear-gradient.

### Reality check (rules vs code)

| `.windsurf` rule says | Actual code |
|---|---|
| Mixpanel analytics | **Not present.** No analytics SDK in mobile. |
| AI via LangChain | Only in `mcp-servers/llm-router` (dev tool), **not** in the app. |
| BullMQ + Redis queues | **Not present.** No backend/queue. |
| Supabase data layer | Removed. Mobile auth/data is **local + anonymous** (device UUID + SQLite). |

Don't add any of the above to the mobile app unless explicitly asked. Persist new user-owned
data in local SQLite (`apps/mobile/src/db/`), not a remote service.

## Commands

Run from repo root unless noted.

```bash
bun install                         # install deps
bun run start                       # Expo dev server (apps/mobile)
bun run ios | bun run android       # run on simulator/emulator
bunx tsc --noEmit                   # typecheck (run inside apps/mobile)

# EAS build/submit (see package.json scripts):
bun run mobile:build:production
bun run mobile:submit:production

# Web site:
bun run --cwd apps/web dev
bun run --cwd apps/web build
```

There is **no test runner or linter wired up** yet. `bun test` works for plain TS in
`mcp-servers/` and `scripts/`, but **not** for the Expo/RN app (use the Expo toolchain there).

## Conventions

- **Files/dirs:** kebab-case for `.ts` files and directories; **PascalCase for `.tsx`
  components**; `camelCase` for functions/variables. (Note: existing component files use
  PascalCase — match the surrounding code.)
- **Exports:** prefer named exports; functional components + hooks only, no classes.
- **Types:** TypeScript everywhere, `strict` on. Prefer interfaces for object shapes; avoid
  `any` and `enum`. Export types separately from values.
- **Imports (mobile):** absolute via `@/...` aliases (configured in `babel.config.js`).
- **Styling:** RN `StyleSheet` (mobile) / Tailwind (web). Theme/colors in
  `apps/mobile/src/constants/`.
- **Secrets:** never commit keys. Public SDK keys via `EXPO_PUBLIC_*` env (`.env`). Sensitive
  values via `expo-secure-store`. Never log SDK keys, purchaser info, or user identifiers.
- Keep modules small and composable (DRY/KISS/YAGNI). Include loading & error states by default.

See `apps/mobile/CLAUDE.md` for app-internal architecture details.
