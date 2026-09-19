# Recalibra Web App

Vite + React web application (Bun runtime) for Recalibra.

## 🚀 Quick Start

From repo root:

```bash
bun install
bun run --cwd apps/web dev
```

Or from `apps/web`:

```bash
bun install
bun run dev
```

## Scripts

- `bun run dev`: start Vite dev server
- `bun run build`: build (runs `prebuild` first)
- `bun run preview`: preview production build

## Typecheck

```bash
bunx tsc -p apps/web/tsconfig.json --noEmit
```

## Mobile brand assets and screenshots

`bun run prebuild` copies Poppins and DM Serif Display font files and brand images from
`apps/mobile/assets`, and generates `src/mobile-theme.css` from the mobile color tokens.
Run it after mobile branding changes; do not hand-edit generated CSS. Missing source
assets fail the sync instead of silently keeping stale files. This is build-time asset
sharing; the deployed website does not load the mobile runtime.

The three images currently shown on the home page are historical development previews,
not captures of the current player/catalog. Before replacing them, record the source
commit, native build version, device/runtime and capture date, using demo-only data.
Capture the actual catalog, detail and active player; do not substitute reconstructed
UI. See `../../docs/ai-office-player-catalog-web.md` for the current verification limit.
