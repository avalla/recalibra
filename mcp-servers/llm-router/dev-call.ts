#!/usr/bin/env bun

import process from 'node:process';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

function mustGetEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var ${name}`);
  return value;
}

function parseArgs(argv: string[]) {
  const args = new Map<string, string>();
  for (let i = 0; i < argv.length; i += 1) {
    const raw = argv[i];
    if (!raw.startsWith('--')) continue;
    const key = raw.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args.set(key, 'true');
      continue;
    }
    args.set(key, next);
    i += 1;
  }

  const tool = args.get('tool') ?? 'llm_review_exercises';
  const payloadRaw = args.get('payload');
  const payload: JsonValue | undefined = payloadRaw ? (JSON.parse(payloadRaw) as JsonValue) : undefined;

  return {
    tool,
    payload,
    listOnly: args.get('list') === 'true',
  };
}

async function main() {
  const { tool, payload, listOnly } = parseArgs(process.argv.slice(2));

  const env: Record<string, string> = {
    OPENAI_MODEL: process.env.OPENAI_MODEL ?? 'gpt-5.2',
    LLM_ROUTER_DEBUG: process.env.LLM_ROUTER_DEBUG ?? '1',
  };

  if (process.env.OPENAI_API_KEY) env.OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (process.env.ANTHROPIC_API_KEY) env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (process.env.ANTHROPIC_MODEL) env.ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL;

  const transport = new StdioClientTransport({
    command: 'bun',
    args: [new URL('./index.ts', import.meta.url).pathname],
    env,
    stderr: 'inherit',
  });

  const client = new Client(
    { name: 'llm-router-dev-call', version: '1.0.0' },
    { capabilities: {} }
  );

  await client.connect(transport);

  const tools = await client.listTools();
  console.log(JSON.stringify({ tools: tools.tools.map((t) => ({ name: t.name, description: t.description })) }, null, 2));

  if (listOnly) {
    await transport.close();
    return;
  }

  if (!payload) {
    // default sample call
    const defaultPayload = {
      preferProvider: 'openai',
      goal: 'Review objectives and best time of day for each exercise. Be conservative with sleep. Return warnings if any.',
      exercises: [
        {
          slug: '4-7-8-breathing',
          name: '4-7-8 Breathing',
          description: 'Promotes relaxation and helps with falling asleep faster. Also known as the relaxing breath.',
          category: 'breathing',
          duration_minutes: 10,
          breathing_special: '',
        },
        {
          slug: 'berserker-breath',
          name: 'Berserker Breath',
          description: 'High-energy breathing for activation and alertness.',
          category: 'breathing',
          duration_minutes: 5,
          breathing_special: 'rapid',
        },
      ],
    };

    const res = await client.callTool({ name: tool, arguments: defaultPayload });
    console.log(JSON.stringify(res, null, 2));
    await transport.close();
    return;
  }

  const res = await client.callTool({ name: tool, arguments: payload as Record<string, unknown> });
  console.log(JSON.stringify(res, null, 2));

  await transport.close();
}

try {
  // Ensure at least one provider key exists.
  // This mirrors server-side checks but provides a clearer CLI error.
  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    throw new Error('Set OPENAI_API_KEY and/or ANTHROPIC_API_KEY in env before running.');
  }
  // OPENAI_API_KEY might be required if preferProvider=openai, but we allow fallback.
  if (process.env.OPENAI_MODEL) {
    void mustGetEnv('OPENAI_MODEL');
  }

  await main();
} catch (err) {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error(error.message);
  process.exit(1);
}
