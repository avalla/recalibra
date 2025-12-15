#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_KEY = process.env.RUNCOMFY_API_KEY;
const BASE_URL = "https://model-api.runcomfy.net";

// Popular video generation models on RunComfy
const VIDEO_MODELS = {
  "wan-2.1": "wanai/wan-2-1/i2v-480p",
  "wan-2.1-720p": "wanai/wan-2-1/i2v-720p",
  "animatediff": "animatediff/animatediff-lightning",
  "svd": "stabilityai/stable-video-diffusion",
  "kling": "kling/kling-1-6/standard/image-to-video",
  "minimax": "minimax/video-01",
};

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`RunComfy API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// Tool implementations
async function generateVideo(modelId, prompt, options = {}) {
  const body = {
    prompt,
    ...options,
  };

  const result = await makeRequest(`/v1/models/${modelId}`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  return result;
}

async function checkStatus(requestId) {
  return makeRequest(`/v1/requests/${requestId}/status`);
}

async function getResult(requestId) {
  return makeRequest(`/v1/requests/${requestId}/result`);
}

async function cancelRequest(requestId) {
  return makeRequest(`/v1/requests/${requestId}/cancel`, {
    method: "POST",
  });
}

async function listModels() {
  return {
    video_models: VIDEO_MODELS,
    note: "Use the model key (e.g., 'wan-2.1') or full model_id",
  };
}

// Create MCP server
const server = new Server(
  {
    name: "runcomfy",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "runcomfy_generate_video",
        description:
          "Generate a video using RunComfy AI models. Returns a request_id to check status later.",
        inputSchema: {
          type: "object",
          properties: {
            model: {
              type: "string",
              description:
                "Model to use. Options: wan-2.1, wan-2.1-720p, animatediff, svd, kling, minimax. Or provide full model_id.",
              default: "wan-2.1",
            },
            prompt: {
              type: "string",
              description: "Text prompt describing the video to generate",
            },
            image_url: {
              type: "string",
              description:
                "Optional: Public HTTPS URL of input image for image-to-video models",
            },
            duration: {
              type: "number",
              description: "Video duration in seconds (model dependent)",
            },
            aspect_ratio: {
              type: "string",
              description: "Aspect ratio like 16:9, 9:16, 1:1",
            },
            seed: {
              type: "number",
              description: "Random seed for reproducibility",
            },
          },
          required: ["prompt"],
        },
      },
      {
        name: "runcomfy_check_status",
        description:
          "Check the status of a RunComfy request. Returns: in_queue, in_progress, completed, or cancelled.",
        inputSchema: {
          type: "object",
          properties: {
            request_id: {
              type: "string",
              description: "The request_id returned from generate_video",
            },
          },
          required: ["request_id"],
        },
      },
      {
        name: "runcomfy_get_result",
        description:
          "Get the result of a completed RunComfy request. Returns video/image URLs.",
        inputSchema: {
          type: "object",
          properties: {
            request_id: {
              type: "string",
              description: "The request_id to fetch results for",
            },
          },
          required: ["request_id"],
        },
      },
      {
        name: "runcomfy_cancel",
        description: "Cancel a queued RunComfy request.",
        inputSchema: {
          type: "object",
          properties: {
            request_id: {
              type: "string",
              description: "The request_id to cancel",
            },
          },
          required: ["request_id"],
        },
      },
      {
        name: "runcomfy_list_models",
        description: "List available video generation models on RunComfy.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      case "runcomfy_generate_video": {
        const modelKey = args.model || "wan-2.1";
        const modelId = VIDEO_MODELS[modelKey] || modelKey;
        const options = {};

        if (args.image_url) options.image_url = args.image_url;
        if (args.duration) options.duration = args.duration;
        if (args.aspect_ratio) options.aspect_ratio = args.aspect_ratio;
        if (args.seed) options.seed = args.seed;

        result = await generateVideo(modelId, args.prompt, options);
        break;
      }

      case "runcomfy_check_status":
        result = await checkStatus(args.request_id);
        break;

      case "runcomfy_get_result":
        result = await getResult(args.request_id);
        break;

      case "runcomfy_cancel":
        result = await cancelRequest(args.request_id);
        break;

      case "runcomfy_list_models":
        result = await listModels();
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  if (!API_KEY) {
    console.error("Error: RUNCOMFY_API_KEY environment variable is required");
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("RunComfy MCP server running");
}

main().catch(console.error);
