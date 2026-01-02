#!/usr/bin/env bun

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { z } from 'zod';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';

type Provider = 'openai' | 'anthropic';

function isDebugEnabled(): boolean {
  const raw = (process.env.LLM_ROUTER_DEBUG ?? '').trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'on';
}

function debugLog(message: string, meta?: Record<string, unknown>): void {
  if (!isDebugEnabled()) return;
  const payload = meta ? ` ${JSON.stringify(meta)}` : '';
  // stderr so it shows up in MCP logs
  // eslint-disable-next-line no-console
  console.error(`[llm-router] ${message}${payload}`);
}

function errorToMeta(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    message: String(error),
  };
}

const ExerciseInputSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  duration_minutes: z.number().int().positive(),
  breathing_special: z.string().optional(),
});

const SeedExerciseInputSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  duration_minutes: z.number().int().positive(),
  objective: z.enum(['relax', 'energy', 'focus', 'sleep']).optional(),
  description: z.string().optional().nullable(),
  instructions: z.array(z.object({ step: z.number().int().positive(), instruction: z.string().min(1) })).optional(),
  safety_warning: z.string().optional().nullable(),
  history: z.string().optional().nullable(),
  benefits: z.array(z.string().min(1)).optional(),
  tips: z.array(z.string().min(1)).optional(),
  breathing_special: z.string().optional(),
  missingFields: z.array(z.enum(['description', 'instructions', 'safety_warning', 'history', 'benefits', 'tips'])).optional(),
});

const ReviewResultItemSchema = z.object({
  slug: z.string().min(1),
  objective: z.enum(['relax', 'energy', 'focus', 'sleep']),
  timeOfDay: z.enum(['morning', 'day', 'evening', 'night', 'any']),
  suggestedDurationMinutes: z.number().int().positive().nullable(),
  confidence: z.number().min(0).max(1),
  rationale: z.string().min(1),
  warnings: z.array(z.string()),
});

const ReviewResultSchema = z.array(ReviewResultItemSchema);

const EnrichPatchSchema = z.object({
  slug: z.string().min(1),
  description: z.string().min(1).optional(),
  instructions: z
    .array(z.object({ step: z.number().int().positive(), instruction: z.string().min(1) }))
    .min(1)
    .optional(),
  safety_warning: z.string().min(1).optional(),
  history: z.string().min(1).optional(),
  benefits: z.array(z.string().min(1)).min(1).optional(),
  tips: z.array(z.string().min(1)).min(1).optional(),
  rationale: z.string().min(1).optional(),
});

const EnrichResultSchema = z.array(EnrichPatchSchema);

function getAvailableProviders(): Provider[] {
  const providers: Provider[] = [];
  if (process.env.OPENAI_API_KEY) providers.push('openai');
  if (process.env.ANTHROPIC_API_KEY) providers.push('anthropic');
  return providers;
}

function chooseProvider(input: { preferStructured: boolean }): Provider {
  const available = getAvailableProviders();
  if (available.length === 0) {
    throw new Error('No LLM provider keys found. Set OPENAI_API_KEY and/or ANTHROPIC_API_KEY in env.');
  }

  // Preference order:
  // - For structured JSON, prefer OpenAI when available.
  // - Otherwise prefer Anthropic when available.
  if (input.preferStructured) {
    if (available.includes('openai')) return 'openai';
    return 'anthropic';
  }

  if (available.includes('anthropic')) return 'anthropic';
  return 'openai';
}

function getModelName(provider: Provider): string {
  if (provider === 'openai') return process.env.OPENAI_MODEL || 'gpt-4o-mini';
  return process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
}

function createChatModel(input: { provider: Provider; modelOverride?: string }) {
  const model = input.modelOverride || getModelName(input.provider);
  debugLog('createChatModel', { provider: input.provider, model });
  if (input.provider === 'openai') {
    return new ChatOpenAI({
      model,
      temperature: 0.2,
    });
  }

  return new ChatAnthropic({
    model,
    temperature: 0.2,
  });
}

async function invokeStructured<T>(input: {
  provider: Provider;
  modelOverride?: string;
  parser: StructuredOutputParser<any>;
  prompt: ChatPromptTemplate;
  variables: Record<string, unknown>;
}): Promise<T> {
  const chat = createChatModel({ provider: input.provider, modelOverride: input.modelOverride });
  const chain = input.prompt.pipe(chat).pipe(input.parser);
  return (await chain.invoke(input.variables)) as T;
}

type ReviewResult = z.infer<typeof ReviewResultSchema>;

type EnrichResult = z.infer<typeof EnrichResultSchema>;

async function reviewExercises(args: unknown): Promise<ReviewResult> {
  const RequestSchema = z.object({
    exercises: z.array(ExerciseInputSchema).min(1),
    goal: z
      .string()
      .optional()
      .default(
        'Propose objective (relax|energy|focus|sleep) and best timeOfDay for each exercise, plus warnings if any.'
      ),
    preferProvider: z.enum(['auto', 'openai', 'anthropic']).optional().default('auto'),
    openaiModel: z.string().optional(),
    anthropicModel: z.string().optional(),
  });

  const parsed = RequestSchema.parse(args);
  const provider =
    parsed.preferProvider === 'auto'
      ? chooseProvider({ preferStructured: true })
      : parsed.preferProvider;

  const modelOverride =
    provider === 'openai' ? parsed.openaiModel : provider === 'anthropic' ? parsed.anthropicModel : undefined;

  debugLog('llm_review_exercises:request', {
    preferProvider: parsed.preferProvider,
    chosenProvider: provider,
    modelOverride: modelOverride ?? null,
    exercisesCount: parsed.exercises.length,
    sampleSlugs: parsed.exercises.slice(0, 5).map((e) => e.slug),
    goalLength: parsed.goal.length,
  });

  const parser: StructuredOutputParser<any> = StructuredOutputParser.fromZodSchema(ReviewResultSchema);
  const formatInstructions = parser.getFormatInstructions();
  debugLog('llm_review_exercises:format_instructions_meta', {
    formatInstructionsLength: formatInstructions.length,
  });

  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      [
        'You are a product+clinical reviewer for a vagus nerve stimulation app.',
        'You MUST follow the output schema exactly.',
        'Be conservative with "sleep": use it mainly for bedtime/insomnia/downshift-to-sleep.',
        'Use "energy" for activating/rapid/Wim Hof/holotropic/cold exposure patterns.',
        'Use "focus" for clarity/concentration/attention; calm but not sleepy can be focus.',
        'Default to "relax" when unsure.',
        '',
        'Return a JSON array with the same length as input.',
        '',
        '{formatInstructions}',
      ].join('\n'),
    ],
    [
      'human',
      [
        'Goal:',
        '{goal}',
        '',
        'Input exercises JSON:',
        '{exercisesJson}',
      ].join('\n'),
    ],
  ]);

  const exercisesJson = JSON.stringify(parsed.exercises);
  debugLog('llm_review_exercises:prompt_meta', {
    exercisesJsonLength: exercisesJson.length,
  });

  try {
    return await invokeStructured<ReviewResult>({
      provider,
      modelOverride,
      parser,
      prompt,
      variables: {
        goal: parsed.goal,
        formatInstructions,
        exercisesJson,
      },
    });
  } catch (err) {
    debugLog('llm_review_exercises:error_primary', errorToMeta(err));
    // Fallback: try once with the other provider if available.
    const available = getAvailableProviders();
    const altProvider: Provider | undefined =
      provider === 'openai'
        ? available.includes('anthropic')
          ? 'anthropic'
          : undefined
        : available.includes('openai')
          ? 'openai'
          : undefined;

    if (!altProvider) throw err;

    const altModelOverride =
      altProvider === 'openai'
        ? parsed.openaiModel
        : altProvider === 'anthropic'
          ? parsed.anthropicModel
          : undefined;

    debugLog('llm_review_exercises:retry_with_alt_provider', { altProvider });
    return invokeStructured<ReviewResult>({
      provider: altProvider,
      modelOverride: altModelOverride,
      parser,
      prompt,
      variables: {
        goal: parsed.goal,
        formatInstructions,
        exercisesJson,
      },
    });
  }
}

async function enrichExercisesSeed(args: unknown): Promise<EnrichResult> {
  const RequestSchema = z.object({
    exercises: z.array(SeedExerciseInputSchema).min(1),
    goal: z
      .string()
      .optional()
      .default(
        'Fill ONLY missing fields for each exercise seed item. Do NOT overwrite fields that already have content. Keep content concise and medically conservative. Instructions must be step-by-step. Safety warnings must be clear when relevant (cold exposure, breath holds, dizziness).'
      ),
    preferProvider: z.enum(['auto', 'openai', 'anthropic']).optional().default('auto'),
    openaiModel: z.string().optional(),
    anthropicModel: z.string().optional(),
  });

  const parsed = RequestSchema.parse(args);
  const provider =
    parsed.preferProvider === 'auto'
      ? chooseProvider({ preferStructured: true })
      : parsed.preferProvider;

  const modelOverride =
    provider === 'openai' ? parsed.openaiModel : provider === 'anthropic' ? parsed.anthropicModel : undefined;

  debugLog('llm_enrich_exercises_seed:request', {
    preferProvider: parsed.preferProvider,
    chosenProvider: provider,
    modelOverride: modelOverride ?? null,
    exercisesCount: parsed.exercises.length,
    sampleSlugs: parsed.exercises.slice(0, 5).map((e) => e.slug),
    goalLength: parsed.goal.length,
  });

  const parser: StructuredOutputParser<any> = StructuredOutputParser.fromZodSchema(EnrichResultSchema);
  const formatInstructions = parser.getFormatInstructions();

  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      [
        'You are a product+clinical writer for a vagus nerve stimulation app exercise catalog.',
        'You MUST follow the output schema exactly.',
        'You MUST NOT overwrite existing content: only provide fields that are missing/empty.',
        'Return ONLY raw JSON. Do NOT wrap your response in markdown fences (no ```json).',
        'Be medically conservative and avoid strong medical claims.',
        'Instructions must be safe, step-by-step, and easy to follow.',
        'If an exercise involves cold exposure or breath holds, include an appropriate safety_warning.',
        '',
        'Return a JSON array with the same length as input.',
        '',
        '{formatInstructions}',
      ].join('\n'),
    ],
    [
      'human',
      [
        'Goal:',
        '{goal}',
        '',
        'Input exercises JSON (some fields may be missing; missingFields lists which ones to fill):',
        '{exercisesJson}',
      ].join('\n'),
    ],
  ]);

  const exercisesJson = JSON.stringify(parsed.exercises);
  debugLog('llm_enrich_exercises_seed:prompt_meta', { exercisesJsonLength: exercisesJson.length });

  try {
    return await invokeStructured<EnrichResult>({
      provider,
      modelOverride,
      parser,
      prompt,
      variables: {
        goal: parsed.goal,
        formatInstructions,
        exercisesJson,
      },
    });
  } catch (err) {
    debugLog('llm_enrich_exercises_seed:error_primary', errorToMeta(err));
    // Retry once with an even stricter instruction if the model ignored formatting/schema.
    const retryGoal = `${parsed.goal}\n\nIMPORTANT: Output must be a single raw JSON array matching the schema. No markdown fences. Include rationale if possible.`;
    return invokeStructured<EnrichResult>({
      provider,
      modelOverride,
      parser,
      prompt,
      variables: {
        goal: retryGoal,
        formatInstructions,
        exercisesJson,
      },
    });
  }
}

const server = new Server(
  {
    name: 'llm-router',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'llm_review_exercises',
        description:
          'Review exercises (objective + timeOfDay + warnings). Routes to the best available LLM provider via LangChain. Returns structured JSON.',
        inputSchema: {
          type: 'object',
          properties: {
            exercises: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                properties: {
                  slug: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                  duration_minutes: { type: 'number' },
                  breathing_special: { type: 'string' },
                },
                required: ['slug', 'name', 'description', 'category', 'duration_minutes'],
              },
            },
            goal: { type: 'string' },
            preferProvider: {
              type: 'string',
              description: 'auto | openai | anthropic',
              default: 'auto',
            },
            openaiModel: {
              type: 'string',
              description: 'Optional per-call OpenAI model override (e.g. gpt-5.2).',
            },
            anthropicModel: {
              type: 'string',
              description: 'Optional per-call Anthropic model override.',
            },
          },
          required: ['exercises'],
        },
      },
      {
        name: 'llm_enrich_exercises_seed',
        description:
          'Propose safe patches to fill missing exercise seed fields (description/instructions/safety_warning/history/benefits/tips). Does not overwrite existing content. Returns structured JSON.',
        inputSchema: {
          type: 'object',
          properties: {
            exercises: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                properties: {
                  slug: { type: 'string' },
                  name: { type: 'string' },
                  category: { type: 'string' },
                  duration_minutes: { type: 'number' },
                  objective: { type: 'string' },
                  description: { type: 'string' },
                  instructions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        step: { type: 'number' },
                        instruction: { type: 'string' },
                      },
                      required: ['step', 'instruction'],
                    },
                  },
                  safety_warning: { type: 'string' },
                  history: { type: 'string' },
                  benefits: { type: 'array', items: { type: 'string' } },
                  tips: { type: 'array', items: { type: 'string' } },
                  breathing_special: { type: 'string' },
                  missingFields: { type: 'array', items: { type: 'string' } },
                },
                required: ['slug', 'name', 'category', 'duration_minutes'],
              },
            },
            goal: { type: 'string' },
            preferProvider: {
              type: 'string',
              description: 'auto | openai | anthropic',
              default: 'auto',
            },
            openaiModel: { type: 'string' },
            anthropicModel: { type: 'string' },
          },
          required: ['exercises'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    debugLog('CallTool', {
      tool: name,
      argsKeys: args && typeof args === 'object' ? Object.keys(args as Record<string, unknown>) : null,
    });
    switch (name) {
      case 'llm_review_exercises': {
        const result = await reviewExercises(args);
        debugLog('llm_review_exercises:success', { items: result.length });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      case 'llm_enrich_exercises_seed': {
        const result = await enrichExercisesSeed(args);
        debugLog('llm_enrich_exercises_seed:success', { items: result.length });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    debugLog('CallTool:error', errorToMeta(error));
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${message}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const available = getAvailableProviders();
  debugLog('startup', {
    availableProviders: available,
    openaiModel: process.env.OPENAI_MODEL ?? null,
    anthropicModel: process.env.ANTHROPIC_MODEL ?? null,
    debug: isDebugEnabled(),
  });
  if (available.length === 0) {
    console.error('Error: Set OPENAI_API_KEY and/or ANTHROPIC_API_KEY in env');
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('llm-router MCP server running');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
