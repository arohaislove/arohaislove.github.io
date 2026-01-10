# Undercurrent API Worker

Backend API for the Undercurrent messaging application. Provides conversation management, message storage, and real-time psychological/linguistic analysis using Claude AI.

## Purpose

This worker handles:
- Creating and managing conversations
- Storing messages in D1 database
- Analyzing messages using Claude API with multiple frameworks:
  - Transactional Analysis (ego states)
  - Speech Act Theory
  - Discourse Analysis
  - Power Dynamics
- Serving messages with analysis to frontend clients

## Setup

### 1. Create D1 Database

First, create a D1 database in your Cloudflare account:

```bash
npx wrangler d1 create undercurrent
```

This will output a database ID. Copy it.

### 2. Update wrangler.toml

Replace the placeholder `database_id` in `wrangler.toml` with the ID from step 1:

```toml
[[d1_databases]]
binding = "DB"
database_name = "undercurrent"
database_id = "your-actual-database-id-here"
```

### 3. Initialize Database Schema

Run the schema setup:

```bash
npx wrangler d1 execute undercurrent --file=./schema.sql
```

This creates the `conversations` and `messages` tables.

### 4. Deploy

The worker will be automatically deployed when merged to main via GitHub Actions. The deployment workflow will:
- Detect the worker in `workers/undercurrent-api/`
- Inject the `ANTHROPIC_API_KEY` secret
- Deploy to `https://undercurrent-api.zammel.workers.dev`

## API Endpoints

### Create Conversation
```
POST /conversation
```

**Response:**
```json
{
  "id": "abc123def456",
  "url": "abc123def456"
}
```

### Get Conversation
```
GET /conversation/:id
```

**Response:**
```json
{
  "id": "abc123def456",
  "created_at": 1234567890
}
```

### Get Messages
```
GET /conversation/:id/messages
```

**Response:**
```json
[
  {
    "id": "msg123",
    "conversation_id": "abc123def456",
    "sender": "Alice",
    "content": "Hello, how are you?",
    "analysis": { ... },
    "created_at": 1234567890
  }
]
```

### Send Message
```
POST /conversation/:id/messages
Content-Type: application/json

{
  "sender": "Alice",
  "content": "Hello, how are you?"
}
```

**Response:**
```json
{
  "id": "msg123",
  "conversation_id": "abc123def456",
  "sender": "Alice",
  "content": "Hello, how are you?",
  "analysis": {
    "transactional_analysis": { ... },
    "speech_act": { ... },
    "discourse": { ... },
    "power_dynamics": { ... },
    "subtext": "..."
  },
  "created_at": 1234567890
}
```

## Analysis Structure

Each message is analyzed using Claude API and includes:

```json
{
  "transactional_analysis": {
    "ego_state": "Parent|Adult|Child",
    "ego_subtype": "Nurturing Parent|Critical Parent|Adult|Free Child|Adapted Child",
    "invited_response": "Parent|Adult|Child",
    "transaction_type": "complementary|crossed|ulterior"
  },
  "speech_act": {
    "primary": "assertive|directive|commissive|expressive|declarative",
    "specific": "request|promise|complaint|greeting|etc."
  },
  "discourse": {
    "markers": ["hedging", "topic_shift", "repair", "interruption", "backchannel"],
    "topic_control": "initiating|maintaining|yielding|competing"
  },
  "power_dynamics": {
    "move": "one-up|one-down|level",
    "indicators": ["advice-giving", "self-deprecation", "agreement"]
  },
  "subtext": "What this message is really doing beneath the surface"
}
```

## Environment Variables

- **ANTHROPIC_API_KEY**: Claude API key (automatically injected by GitHub Actions)

## Local Development

To test locally:

```bash
# Install dependencies
npm install

# Run locally with wrangler
npx wrangler dev

# Test with curl
curl http://localhost:8787/conversation -X POST
```

## Used By

- `undercurrent/` - Frontend messaging application
