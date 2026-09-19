# Journey QA and Decisions
> Offline/accessibility checks and voice/adaptive scope

JRN-05: apps/mobile/src/screens/journeys/JourneyDetailScreen.tsx + JourneyRunnerScreen.tsx
- Local SQLite is authoritative; progress reloads via apps/mobile/src/db/journeys.ts:getJourneyProgress()
- Device checks remain manual: airplane mode, force-close/reopen, VoiceOver/TalkBack, enlarged text

JRN-06: docs/implementation/JRN-06-voice-adaptive-evaluation.md
- Existing audio is preset/procedural; no narrated voice assets or TTS pipeline
- Recommended next increment: optional bundled narration + transcript; deterministic local adaptation only

Updated: 2026-09-18
