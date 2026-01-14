# Second Brain Worker

AI-powered personal knowledge system that captures, classifies, and reminds you about the things that matter.

**Used by:** `/second-brain/` capture interface

## What It Does

1. **You speak or type** → captured via web interface or direct API
2. **Claude classifies** → todo, expense, calendar, creative, note, person, project
3. **Stored in Cloudflare KV** → persistent, fast, queryable
4. **Analyzed every 4 hours** → patterns, connections, overdue items
5. **Notifies your phone** → via Ntfy when something needs attention

## Setup

### 1. Create KV Namespace

```bash
cd workers/second-brain
npx wrangler kv:namespace create "BRAIN_KV"
```

Copy the ID and update `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "BRAIN_KV"
id = "your-kv-id-here"
```

### 2. Generate Auth Token

```bash
# Generate a secure random token
openssl rand -hex 32
```

Save this token - you'll need it for both the worker secret and the frontend config.

### 3. Configure Secrets

Add these secrets via GitHub repository settings (Settings → Secrets and variables → Actions):

- `AUTH_TOKEN` - The token you just generated (for worker authentication)
- `NTFY_TOPIC` - Your unique notification topic (e.g., `second-brain-yourname-2026`)

The `ANTHROPIC_API_KEY` should already be configured.

### 4. Deploy Worker

Once merged to main, GitHub Actions will automatically deploy the worker to:
```
https://second-brain.zammel.workers.dev
```

### 5. Configure Frontend

Update `/second-brain/script.js`:

```javascript
const CONFIG = {
    WORKER_URL: 'https://second-brain.zammel.workers.dev',
    AUTH_TOKEN: 'your-auth-token-here' // Same token from step 2
};
```

### 6. Set Up Notifications (Android)

1. Install **Ntfy** app from Play Store
2. Open it, tap "+" to subscribe
3. Enter your topic name (same as NTFY_TOPIC secret)
4. Done! You'll get notifications when the brain has something to say

## API Endpoints

All endpoints except `/health` require `Authorization: Bearer YOUR_TOKEN` header.

### POST /capture
Capture a new item.

```bash
curl -X POST https://second-brain.zammel.workers.dev/capture \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"input": "Pick up milk on the way home", "source": "voice"}'
```

Response:
```json
{
  "success": true,
  "item": {
    "id": "abc123",
    "type": "todo",
    "input": "Pick up milk on the way home",
    "structured": {
      "task": "Pick up milk",
      "priority": "low",
      "dueHint": "today, on commute"
    },
    "aiNotes": "Routine errand, no urgency",
    "source": "voice",
    "createdAt": "2026-01-14T12:00:00.000Z",
    "status": "active"
  }
}
```

### GET /items
List captured items.

Query parameters:
- `type` - filter by type (todo, expense, calendar, creative, note, person, project)
- `status` - filter by status (active, done, all) - default: active
- `limit` - max items (1-500) - default: 50

```bash
curl https://second-brain.zammel.workers.dev/items?type=todo&limit=10 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET /item/:id
Get a single item by ID.

```bash
curl https://second-brain.zammel.workers.dev/item/abc123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### PATCH /item/:id
Update item classification (for corrections).

```bash
curl -X PATCH https://second-brain.zammel.workers.dev/item/abc123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type": "expense", "status": "done"}'
```

### GET /export
Export all data as JSON (data portability).

```bash
curl https://second-brain.zammel.workers.dev/export \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o second-brain-backup.json
```

Returns:
```json
{
  "exportedAt": "2026-01-14T12:00:00.000Z",
  "version": "1.0.0",
  "summary": {
    "totalItems": 142,
    "byType": {
      "todo": 45,
      "expense": 23,
      "creative": 18,
      "note": 56
    },
    "activeItems": 38,
    "claudeNotes": 5
  },
  "items": [...],
  "claudeNotes": {...},
  "latestAnalysis": {...}
}
```

### POST /analyze
Manually trigger analysis (normally runs every 4 hours via cron).

```bash
curl -X POST https://second-brain.zammel.workers.dev/analyze \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### GET /claude-notes
Get Claude's working memory between analysis runs.

```bash
curl https://second-brain.zammel.workers.dev/claude-notes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### POST /claude-notes
Add a note for Claude's future self.

```bash
curl -X POST https://second-brain.zammel.workers.dev/claude-notes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "note": "User mentioned frustration with X, follow up gently",
    "category": "followup",
    "expiresIn": 604800
  }'
```

Categories: `observation`, `followup`, `pattern`, `summary`, `general`

### DELETE /claude-notes
Clear Claude notes (all or by category).

```bash
# Clear all
curl -X DELETE https://second-brain.zammel.workers.dev/claude-notes \
  -H "Authorization: Bearer YOUR_TOKEN"

# Clear specific category
curl -X DELETE https://second-brain.zammel.workers.dev/claude-notes \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category": "followup"}'
```

### GET /health
Health check (no authentication required).

```bash
curl https://second-brain.zammel.workers.dev/health
```

## Item Types

| Type | Structured Fields | Example |
|------|------------------|---------|
| **todo** | task, priority, dueHint | "Call mum tomorrow" |
| **expense** | amount, category, vendor, date | "Garage $180 for car service" |
| **calendar** | event, dateHint, timeHint, location | "Dentist Friday 2pm" |
| **creative** | content, theme, connectedTo | "Tide patterns like breathing..." |
| **note** | summary, tags | "Remember the coastguard meeting notes" |
| **person** | name, context, detail | "Sarah mentioned she's moving to Auckland" |
| **project** | project, update, nextAction | "Undercurrent - need to fix the haptics" |

## How Analysis Works

Every 4 hours, the cron job:

1. Checks if there are new items since last analysis
2. If yes, loads recent items (last 50)
3. Reads Claude's previous notes to itself
4. Sends everything to Claude with context
5. Claude looks for:
   - Overdue or forgotten todos
   - Patterns in your thinking
   - Connections between ideas
   - Things that need attention
6. Claude writes notes to its future self
7. If something's urgent, sends a notification

The notification is conversational, not robotic:
> "Hey, you mentioned calling the insurance company 3 days ago - still on your radar?"

## Environment Variables

Set via `wrangler secret put` or GitHub Actions secrets:

- `ANTHROPIC_API_KEY` - Anthropic API key (automatically configured)
- `NTFY_TOPIC` - Ntfy.sh topic for notifications
- `AUTH_TOKEN` - Bearer token for authentication

## Security Features

- **Bearer token authentication** - All endpoints (except health) require valid auth
- **Input validation** - Max 5000 characters per capture
- **Rate limiting ready** - Structure in place for future rate limits
- **CORS properly configured** - Allows browser requests with credentials

## Architecture

```
┌──────────────┐     ┌─────────────────────┐
│ Your Phone   │────▶│ Cloudflare Worker   │
│ (voice/text) │     │ - /capture          │
└──────────────┘     │ - /items            │
                     │ - /export           │
                     │ - /analyze          │
                     └─────────┬───────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
           ▼                   ▼                   ▼
    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
    │ Claude API  │    │ KV Storage  │    │ Ntfy.sh     │
    │ (classify)  │    │ (persist)   │    │ (notify)    │
    └─────────────┘    └─────────────┘    └─────────────┘
```

## Future Enhancements

- [ ] Google Sheets sync for human-readable spreadsheet view
- [ ] Weekly digest email
- [ ] Search across all items (full-text)
- [ ] Deduplication for repeated captures
- [ ] Smart rate limiting per user
- [ ] Voice-only mode with wake word
- [ ] Calendar integration for event creation

## Troubleshooting

**Worker not responding:**
- Check `wrangler tail` for logs
- Verify AUTH_TOKEN is set: `wrangler secret list`
- Test health endpoint: `curl https://second-brain.zammel.workers.dev/health`

**401 Unauthorized:**
- Verify AUTH_TOKEN matches in worker secret and frontend config
- Check Authorization header format: `Bearer YOUR_TOKEN`

**Notifications not arriving:**
- Verify NTFY_TOPIC matches your app subscription
- Check Ntfy app permissions (notifications enabled)
- Test manually: `curl -d "Test message" ntfy.sh/your-topic`

**Classification wrong:**
- Use PATCH /item/:id to correct the classification
- The AI learns from patterns but isn't perfect
- Future version will use corrections as feedback

## Development

```bash
# Install dependencies
npm install

# Run locally
npx wrangler dev

# Deploy
npx wrangler deploy

# View logs
npx wrangler tail
```

---

Built for humans who think faster than they can organize.
