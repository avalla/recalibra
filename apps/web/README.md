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
