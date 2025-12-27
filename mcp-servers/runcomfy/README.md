# RunComfy MCP Server

MCP server to generate AI videos using the RunComfy APIs.

## Setup

1. Install dependencies:
```bash
cd mcp-servers/runcomfy
bun install
```

2. Get your API key from: https://www.runcomfy.com/profile

3. Add the configuration to your `~/.windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "runcomfy": {
      "command": "node",
      "args": ["/Users/andrea/dev/node/recalibra/mcp-servers/runcomfy/index.js"],
      "env": {
        "RUNCOMFY_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

4. Restart Windsurf

## Available tools

### runcomfy_generate_video
Generate an AI video. Parameters:
- `prompt` (required): Video description
- `model`: wan-2.1, wan-2.1-720p, animatediff, svd, kling, minimax
- `image_url`: Image URL for image-to-video models
- `duration`: Duration in seconds
- `aspect_ratio`: 16:9, 9:16, 1:1
- `seed`: Seed for reproducibility

### runcomfy_check_status
Check the status of a request.

### runcomfy_get_result
Get the result (video URL) of a completed request.

### runcomfy_cancel
Cancel a queued request.

### runcomfy_list_models
List available video models.

## Usage example

```
// Generate video
runcomfy_generate_video({
  prompt: "A calm person breathing slowly, teal glow, dark background",
  model: "wan-2.1",
  aspect_ratio: "1:1"
})

// Check status
runcomfy_check_status({ request_id: "abc123" })

// Get result
runcomfy_get_result({ request_id: "abc123" })
```

