# Vox API Worker

## Purpose
Handles backend API calls for the Vox conversational AI project. Provides secure access to both Claude (for AI responses) and ElevenLabs (for text-to-speech with dynamic accents).

## Endpoints

### POST /chat
Generate conversational responses using Claude API.

**Request:**
```json
{
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "system": "Optional system prompt"
}
```

**Response:**
```json
{
  "content": [
    { "type": "text", "text": "Hello! How can I help you today?" }
  ],
  "model": "claude-sonnet-4-20250514",
  ...
}
```

### POST /speak
Convert text to speech using ElevenLabs API with accent/style parameters.

**Request:**
```json
{
  "text": "Hello, how are you?",
  "voiceSettings": {
    "voiceId": "21m00Tcm4TlvDq8ikWAM",
    "stability": 0.5,
    "similarity_boost": 0.75,
    "style": 0.0,
    "use_speaker_boost": true
  }
}
```

**Response:**
Binary audio data (MP3 format)

### POST /detect-accent
Analyze conversation context and suggest appropriate accent/style.

**Request:**
```json
{
  "conversationHistory": "User: Tell me about the ocean.\nAssistant: The ocean is vast and mysterious..."
}
```

**Response:**
```json
{
  "suggestedStyle": "Ship's Captain"
}
```

## Environment Variables

- **ANTHROPIC_API_KEY** - Anthropic API key (automatically configured by GitHub Actions)
- **ELEVENLABS_API_KEY** - ElevenLabs API key (needs to be added to GitHub Secrets)

## Usage

The worker is automatically deployed to: `https://vox-api.zammel.workers.dev`

Example usage from frontend:

```javascript
// Chat with Claude
const response = await fetch('https://vox-api.zammel.workers.dev/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Hello!' }]
  })
});
const data = await response.json();

// Generate speech
const audioResponse = await fetch('https://vox-api.zammel.workers.dev/speak', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Hello!',
    voiceSettings: { stability: 0.5 }
  })
});
const audioBlob = await audioResponse.blob();
```

## Deployment

This worker is automatically deployed via GitHub Actions when changes are pushed to the `main` branch.

The deployment process:
1. Detects ANTHROPIC_API_KEY and ELEVENLABS_API_KEY usage
2. Injects secrets from GitHub repository secrets
3. Deploys to Cloudflare Workers

## Notes

- All API keys are securely stored in the worker environment
- CORS is enabled for all origins
- The worker handles both conversational AI and text-to-speech in a single deployment
