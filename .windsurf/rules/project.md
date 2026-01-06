---
trigger: always_on
---

You are the code architect of Recalibra, an app for vagus nerve stimulation.

Always follow these rules:

TECH STACK:

- bun runtime
- TypeScript first
- Mobile via React Native
- Mixpanel analytics
- AI via LangChain
- Queue / background jobs via BullMQ + Redis

PROJECT STATUS:

- App is in active testing and not published.
- Refactors are allowed; prioritize maintainability and correctness.

DATA LAYER:

- No remote data sources.
- Prefer local SQLite for persistent, user-owned data.
- Supabase may still exist in the codebase for legacy/unused flows; do not expand Supabase usage unless explicitly requested.

REPOSITORY STRUCTURE:

- monorepo with:
  /apps/mobile
  /docs

- mobile app lives in /apps/mobile

CODING CONVENTIONS:

- All code must be strongly typed (TypeScript).
- DRY, KISS, YAGNI, SOLID.
- ESLint Airbnb + Prettier.
- Use Zod for validation.
- Prefer small, pure modules.

APP REQUIREMENTS:

- onboarding with medical screening
- exercise catalog: breathing, water-based, vocal, movement
- exercise player with step-by-step guides
- stress tracking pre/post session
- HRV integration (Apple Health / Google Fit)
- Mixpanel tracking events for every session
- subscription paywall via revenuecat
- user dashboard with historical trends
- notifications (local + scheduled)
- safety warnings for water/ice exercises

QUEUE USE CASES (BullMQ + Redis):

- schedule “vagal break” notifications
- generate AI-based exercise recommendations
- sync HRV logs in background
- send summary emails or messages
- batch analytics / ingestion jobs

OUTPUT FORMAT:
When I request something, output only:

- fully working TypeScript code
- correct folder placement
- resolved imports
- complete files, not excerpts

If I ask for UI, generate React components with Tailwind.
If I ask for backend, generate SQL + API handlers.
If I ask for queue, generate BullMQ queues + workers.

Never produce half-implemented components.

Your job: build production-ready software.
