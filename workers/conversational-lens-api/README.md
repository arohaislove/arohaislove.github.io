# Conversational Lens API

## Purpose
Analyzes conversations through multiple analytical frameworks using Claude AI.

## Endpoints
- **POST /** - Analyze a conversation

## Request Format
```json
{
  "conversation": "Alice: Hello there\nBob: Hi! How are you?\nAlice: I'm doing well, thanks!"
}
```

The conversation can be formatted in multiple ways:
- Lines with speaker labels: `"Speaker: text"`
- Alternating lines (auto-assigns A/B speakers)
- Mixed formats

## Response Format
```json
{
  "utterances": [
    {
      "index": 0,
      "speaker": "Alice",
      "text": "Hello there",
      "lenses": {
        "transactional_analysis": {
          "ego_state": "adult",
          "transaction_type": "complementary"
        },
        "speech_act": {
          "primary": "expressing",
          "indirect": "none"
        },
        "emotional_register": {
          "surface": "friendly",
          "underlying": "friendly",
          "intensity": 2
        }
      }
    }
  ]
}
```

## Analytical Lenses

### 1. Transactional Analysis
- **Ego States**: parent-critical, parent-nurturing, adult, child-free, child-adaptive
- **Transaction Types**: complementary, crossed, ulterior

### 2. Speech Acts
- **Primary Types**: requesting, asserting, promising, expressing, declaring
- **Indirect**: Same types, or "none" if surface matches intent

### 3. Emotional Register
- **Surface**: Outwardly expressed emotion
- **Underlying**: Emotion beneath the surface (if different)
- **Intensity**: 1-5 scale

## Environment Variables
- **ANTHROPIC_API_KEY** - Anthropic API key (automatically configured by GitHub Actions)

## Usage
Deployed at: `https://conversational-lens-api.zammel.workers.dev`

```javascript
const response = await fetch('https://conversational-lens-api.zammel.workers.dev', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    conversation: "Your conversation text here..."
  })
});

const data = await response.json();
console.log(data.utterances);
```
