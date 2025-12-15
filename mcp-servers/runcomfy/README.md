# RunComfy MCP Server

MCP server per generare video con AI usando le API di RunComfy.

## Setup

1. Installa le dipendenze:
```bash
cd mcp-servers/runcomfy
bun install
```

2. Ottieni la tua API key da: https://www.runcomfy.com/profile

3. Aggiungi la configurazione al tuo `~/.windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "runcomfy": {
      "command": "node",
      "args": ["/Users/andrea/dev/node/vagoflow/mcp-servers/runcomfy/index.js"],
      "env": {
        "RUNCOMFY_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

4. Riavvia Windsurf

## Tools disponibili

### runcomfy_generate_video
Genera un video con AI. Parametri:
- `prompt` (required): Descrizione del video
- `model`: wan-2.1, wan-2.1-720p, animatediff, svd, kling, minimax
- `image_url`: URL immagine per modelli image-to-video
- `duration`: Durata in secondi
- `aspect_ratio`: 16:9, 9:16, 1:1
- `seed`: Seed per riproducibilità

### runcomfy_check_status
Controlla lo stato di una richiesta.

### runcomfy_get_result
Ottiene il risultato (URL video) di una richiesta completata.

### runcomfy_cancel
Cancella una richiesta in coda.

### runcomfy_list_models
Lista i modelli video disponibili.

## Esempio di utilizzo

```
// Genera video
runcomfy_generate_video({
  prompt: "A calm person breathing slowly, teal glow, dark background",
  model: "wan-2.1",
  aspect_ratio: "1:1"
})

// Controlla status
runcomfy_check_status({ request_id: "abc123" })

// Ottieni risultato
runcomfy_get_result({ request_id: "abc123" })
```
