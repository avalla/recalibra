
---
trigger: always_on
description: RevenueCat integration rules (React Native / Expo)
---

# RevenueCat

## Principles

- Never commit API keys, entitlement identifiers, or customer identifiers to the repo.
- Treat RevenueCat as the source of truth for subscription state (entitlements), not local flags.
- Prefer server-driven entitlements checks over client-side product ID assumptions.

## React Native / Expo guidelines

- Keep RevenueCat wiring in a single module (e.g., `src/services/revenuecat/*`) and expose a small typed interface.
- Initialize once at app start.
- Use a single subscription listener to keep state in sync.
- Gate premium features by **entitlements** (e.g., `pro`) rather than by SKU/product IDs.

## Environment & secrets

- Store public SDK keys in build-time config (e.g., EAS secrets / env vars) and read them via the app config layer.
- Never log:
  - the SDK key
  - purchaser info payloads
  - user identifiers that can be tied back to a person

## Error handling

- Always show a user-friendly error for purchase failures.
- Distinguish between:
  - user cancellation
  - network errors
  - store errors
  - unexpected exceptions

## Analytics

- Track high-level events only:
  - paywall viewed
  - purchase started
  - purchase succeeded
  - restore started
  - restore succeeded
  - purchase failed (bucketed reason)

## Testing & safety

- Use sandbox/test accounts and store test builds.
- Validate restore purchases flow.
- Verify entitlement updates after:
  - purchase
  - restore
  - app reinstall
  - device change
