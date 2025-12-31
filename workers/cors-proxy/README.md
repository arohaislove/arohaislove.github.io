# CORS Proxy Worker

This Cloudflare Worker provides a CORS proxy for the Anthropic API, enabling browser-based applications to make API calls without cross-origin restrictions.

## Purpose

Browser security policies (CORS) prevent web applications from making direct API calls to services like Anthropic. This worker acts as a middleman that:
1. Receives requests from the browser app
2. Forwards them to the Anthropic API
3. Returns responses with proper CORS headers

## Used By

- **Ekphrasis** - Image-to-poetry web app

## Deployment

### Automatic (Recommended)
The worker is automatically deployed via GitHub Actions when changes are merged to the main branch.

### Manual Deployment
If you need to deploy manually:

```bash
cd workers/cors-proxy
npx wrangler deploy
```

You'll need:
- Cloudflare account
- Wrangler CLI installed (`npm install -g wrangler`)
- Authenticated with `wrangler login`

## Worker URL

Once deployed, the worker is available at:
```
https://cors-proxy.zammel.workers.dev
```

## Testing

You can test the worker with curl:

```bash
curl -X POST https://cors-proxy.zammel.workers.dev \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-5-sonnet-20241022",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## Security Notes

- The worker allows all origins (`Access-Control-Allow-Origin: *`)
- API keys are passed through from the client (not stored in the worker)
- Only POST requests are allowed
- Requests are forwarded directly to Anthropic without modification

## Configuration

See `wrangler.toml` for worker configuration.
