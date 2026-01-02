#!/usr/bin/env bun

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { z } from 'zod';

type SeedRow = {
  id: string;
  slug?: string;
  name: string;
  description?: string | null;
  category: string;
  objective?: string;
  level: string;
  duration_minutes: number;
  image_url: string | null;
  instructions?: string;
  safety_warning?: string | null;
  is_premium: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  audio_preset: string;
  origin: string | null;
  breathing_pattern: string | null;
  history: string | null;
  benefits: string | null;
  tips: string | null;
};

type Instruction = { step: number; instruction: string };

type Patch = {
  slug: string;
  description?: string;
  instructions?: Instruction[];
  safety_warning?: string;
  history?: string;
  benefits?: string[];
  tips?: string[];
  rationale?: string;
};

const PatchSchema = z.array(
  z.object({
    slug: z.string().min(1),
    description: z.string().min(1).optional(),
    instructions: z.array(z.object({ step: z.number().int().positive(), instruction: z.string().min(1) })).optional(),
    safety_warning: z.string().min(1).optional(),
    history: z.string().min(1).optional(),
    benefits: z.array(z.string().min(1)).optional(),
    tips: z.array(z.string().min(1)).optional(),
    rationale: z.string().min(1).optional(),
  })
);

function stripMarkdownCodeFences(input: string): string {
  const trimmed = input.trim();
  if (!trimmed.startsWith('```')) return trimmed;
  return trimmed
    .replace(/^```[a-zA-Z]*\n/, '')
    .replace(/\n```$/, '')
    .trim();
}

function parseJsonOptional<T>(raw: string | null | undefined): T | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

function isEmptyText(value: string | null | undefined): boolean {
  if (value == null) return true;
  const v = value.trim();
  if (!v) return true;
  if (v === '...' || v === 'TODO') return true;
  return false;
}

function buildMissingFields(row: SeedRow): Array<'description' | 'instructions' | 'safety_warning' | 'history' | 'benefits' | 'tips'> {
  const missing: Array<'description' | 'instructions' | 'safety_warning' | 'history' | 'benefits' | 'tips'> = [];
  if (isEmptyText(row.description)) missing.push('description');

  const instructions = parseJsonOptional<Instruction[]>(row.instructions);
  if (!instructions || instructions.length === 0) missing.push('instructions');

  if (isEmptyText(row.safety_warning)) missing.push('safety_warning');
  if (isEmptyText(row.history)) missing.push('history');

  const benefits = parseJsonOptional<string[]>(row.benefits);
  if (!benefits || benefits.length === 0) missing.push('benefits');

  const tips = parseJsonOptional<string[]>(row.tips);
  if (!tips || tips.length === 0) missing.push('tips');

  return missing;
}

function applyPatchToRow(row: SeedRow, patch: Patch): SeedRow {
  if (row.slug !== patch.slug) return row;

  const next: SeedRow = { ...row };

  if (patch.description && isEmptyText(next.description)) next.description = patch.description;

  if (patch.instructions) {
    const current = parseJsonOptional<Instruction[]>(next.instructions);
    if (!current || current.length === 0) next.instructions = JSON.stringify(patch.instructions);
  }

  if (patch.safety_warning && isEmptyText(next.safety_warning)) next.safety_warning = patch.safety_warning;
  if (patch.history && isEmptyText(next.history)) next.history = patch.history;

  if (patch.benefits) {
    const current = parseJsonOptional<string[]>(next.benefits);
    if (!current || current.length === 0) next.benefits = JSON.stringify(patch.benefits);
  }

  if (patch.tips) {
    const current = parseJsonOptional<string[]>(next.tips);
    if (!current || current.length === 0) next.tips = JSON.stringify(patch.tips);
  }

  return next;
}

async function main(): Promise<void> {
  const args = new Map<string, string>();
  for (let i = 2; i < process.argv.length; i += 1) {
    const token = process.argv[i];
    if (!token) continue;
    const next = process.argv[i + 1];
    if (token.startsWith('--') && next && !next.startsWith('--')) {
      args.set(token.slice(2), next);
      i += 1;
      continue;
    }
    if (token.startsWith('--')) args.set(token.slice(2), 'true');
  }

  const openaiModel = args.get('openaiModel');
  const preferProvider = args.get('preferProvider') ?? 'openai';
  const chunkSize = Number(args.get('chunkSize') ?? '10');
  const maxChunksRaw = args.get('maxChunks');
  const maxChunks = maxChunksRaw ? Number(maxChunksRaw) : undefined;
  const isDryRun = (args.get('dryRun') ?? 'false').toLowerCase() === 'true';

  const repoRoot = new URL('../../', import.meta.url).pathname;
  const mobileDataDir = `${repoRoot}/apps/mobile/src/data`;

  const files = [
    'exercises_seed_breathing.json',
    'exercises_seed_water.json',
    'exercises_seed_movement.json',
    'exercises_seed_sensory.json',
  ];

  const serverPath = new URL('./index.ts', import.meta.url).pathname;

  const env: Record<string, string> = Object.fromEntries(
    Object.entries(process.env)
      .filter(([, value]) => typeof value === 'string')
      .map(([key, value]) => [key, value as string])
  );

  const transport = new StdioClientTransport({
    command: 'bun',
    args: [serverPath],
    env,
  });

  const client = new Client({ name: 'llm-router-enrich-seed', version: '1.0.0' }, { capabilities: {} });
  await client.connect(transport);

  try {
    let chunksProcessed = 0;
    for (const file of files) {
      const path = `${mobileDataDir}/${file}`;
      const text = await Bun.file(path).text();
      const rows = JSON.parse(text) as SeedRow[];

      const pending = rows
        .map((r) => ({ row: r, missing: buildMissingFields(r) }))
        .filter((x) => x.missing.length > 0);

      if (pending.length === 0) continue;

      for (let start = 0; start < pending.length; start += chunkSize) {
        if (typeof maxChunks === 'number' && chunksProcessed >= maxChunks) return;
        const slice = pending.slice(start, start + chunkSize);

        const payloadExercises = slice.map(({ row, missing }) => {
          const breathingSpecial = parseJsonOptional<{ special?: string }>(row.breathing_pattern)?.special;
          return {
            slug: row.slug ?? '',
            name: row.name,
            category: row.category,
            duration_minutes: row.duration_minutes,
            objective: row.objective,
            description: row.description,
            instructions: parseJsonOptional<Instruction[]>(row.instructions),
            safety_warning: row.safety_warning,
            history: row.history,
            benefits: parseJsonOptional<string[]>(row.benefits),
            tips: parseJsonOptional<string[]>(row.tips),
            breathing_special: breathingSpecial,
            missingFields: missing,
          };
        });

        const result = (await client.callTool({
          name: 'llm_enrich_exercises_seed',
          arguments: {
            preferProvider,
            openaiModel,
            exercises: payloadExercises,
          },
        })) as { content: Array<{ type: string; text?: string }> };

        const textOutRaw = result.content?.[0]?.text ?? '[]';
        if (textOutRaw.trim().startsWith('Error:')) {
          throw new Error(textOutRaw);
        }

        const textOut = stripMarkdownCodeFences(textOutRaw);
        const patches = PatchSchema.parse(JSON.parse(textOut)) as Patch[];

        const patchBySlug = new Map(patches.map((p) => [p.slug, p] as const));
        const nextRows = rows.map((r) => {
          const slug = r.slug ?? '';
          const patch = patchBySlug.get(slug);
          return patch ? applyPatchToRow(r, patch) : r;
        });

        if (!isDryRun) {
          await Bun.write(path, JSON.stringify(nextRows));
        }

        chunksProcessed += 1;
      }
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
