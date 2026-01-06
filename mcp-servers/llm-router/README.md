# LLM Router MCP Server

MCP server that routes requests to the best available LLM provider via **LangChain**.

## What it does

- Exposes MCP tools over stdio.
- Chooses provider automatically based on available env keys:
  - `OPENAI_API_KEY`
  - `ANTHROPIC_API_KEY`
- Designed for **structured JSON** outputs (exercise review, etc.).

## Install

```bash
bun install
```

## Typecheck

```bash
bunx tsc -p tsconfig.json --noEmit
```

Run (for debugging):

```bash
OPENAI_API_KEY=... bun ./index.ts
```

## Terminal test (Option B)

This repo includes a small MCP client that spawns the server over stdio and calls the tool.

List tools:

```bash
OPENAI_API_KEY=... OPENAI_MODEL=gpt-5.2 LLM_ROUTER_DEBUG=1 bun ./dev-call.ts --list
```

Call `llm_review_exercises` with a built-in sample payload:

```bash
OPENAI_API_KEY=... OPENAI_MODEL=gpt-5.2 LLM_ROUTER_DEBUG=1 bun ./dev-call.ts
```

Call with a custom payload (JSON):

```bash
OPENAI_API_KEY=... OPENAI_MODEL=gpt-5.2 LLM_ROUTER_DEBUG=1 bun ./dev-call.ts \
  --tool llm_review_exercises \
  --payload '{"preferProvider":"openai","openaiModel":"gpt-5.2","exercises":[{"slug":"4-7-8-breathing","name":"4-7-8 Breathing","description":"Promotes relaxation...","category":"breathing","duration_minutes":10}]}'
```

## Windsurf MCP config

Add to `~/.windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "llm-router": {
      "command": "bun",
      "args": ["/Users/andrea/dev/node/vagoflow/mcp-servers/llm-router/index.ts"],
      "env": {
        "OPENAI_API_KEY": "YOUR_OPENAI_KEY",
        "ANTHROPIC_API_KEY": "YOUR_ANTHROPIC_KEY",
        "OPENAI_MODEL": "gpt-4o-mini",
        "ANTHROPIC_MODEL": "claude-3-5-sonnet-20241022"
      }
    }
  }
}
```

Restart Windsurf after editing.

## Tools

## llm_review_exercises

Input: array of exercises and an optional goal.
Output: JSON array with `{ slug, objective, timeOfDay, suggestedDurationMinutes, confidence, rationale, warnings }`.

Example call:

```js
llm_review_exercises({
  exercises: [
    {
      slug: "4-7-8-breathing",
      name: "4-7-8 Breathing",
      description: "Promotes relaxation and helps with falling asleep faster.",
      category: "breathing",
      duration_minutes: 10,
      breathing_special: ""
    }
  ]
})
```

## llm_enrich_exercises_seed

Input: array of seed exercises (can include existing fields + `missingFields`).
Output: JSON array of patches `{ slug, description?, instructions?, safety_warning?, history?, benefits?, tips?, rationale? }`.

Notes:
- Only fill missing/empty fields.
- Returns raw JSON (no markdown fences).

## Batch enrich seed JSON

This repo includes a batch script that reads the per-category seed JSON files in `apps/mobile/src/data/` and fills missing fields using `llm_enrich_exercises_seed`.

Seed files (source of truth):

- `apps/mobile/src/data/exercises_seed_breathing.json`
- `apps/mobile/src/data/exercises_seed_water.json`
- `apps/mobile/src/data/exercises_seed_movement.json`
- `apps/mobile/src/data/exercises_seed_sensory.json`

Dry-run (no writes):

```bash
OPENAI_API_KEY=... OPENAI_MODEL=gpt-5.2 LLM_ROUTER_DEBUG=1 bun ./enrich-seed.ts \
  --preferProvider openai \
  --openaiModel gpt-5.2 \
  --chunkSize 8 \
  --maxChunks 1 \
  --dryRun true
```

Write-mode (updates JSON files):

```bash
OPENAI_API_KEY=... OPENAI_MODEL=gpt-5.2 bun ./enrich-seed.ts \
  --preferProvider openai \
  --openaiModel gpt-5.2 \
  --chunkSize 8 \
  --dryRun false
```
