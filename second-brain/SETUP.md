# Second Brain - Setup Instructions

Quick guide to get your Second Brain up and running.

## Prerequisites

- Android phone with Ntfy app (for notifications)
- GitHub account with access to this repository
- Cloudflare account (for worker deployment)

## Setup Steps

### 1. Generate Auth Token

First, generate a secure random token for authentication:

```bash
# On Mac/Linux:
openssl rand -hex 32

# Or use any password generator to create a 64-character hex string
```

**Save this token!** You'll need it in steps 2 and 5.

### 2. Add GitHub Secrets

Go to: https://github.com/arohaislove/arohaislove.github.io/settings/secrets/actions

Add these repository secrets:

1. **AUTH_TOKEN**
   - Click "New repository secret"
   - Name: `AUTH_TOKEN`
   - Value: [paste the token from step 1]

2. **NTFY_TOPIC**
   - Click "New repository secret"
   - Name: `NTFY_TOPIC`
   - Value: Choose a unique topic name (e.g., `second-brain-yourname-2026`)
   - Remember this - you'll subscribe to it in step 4

Note: `CF_ACCOUNT_ID`, `CF_API_KEY`, and `ANTHROPIC_API_KEY` should already be configured.

### 3. Create KV Namespace

This needs to be done once after the worker is deployed:

```bash
cd workers/second-brain
npx wrangler kv:namespace create "BRAIN_KV"
```

This will output something like:
```
{ binding = "BRAIN_KV", id = "abc123def456..." }
```

Copy the `id` value and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "BRAIN_KV"
id = "abc123def456..."  # Replace with your actual ID
```

Commit this change to the repository.

### 4. Set Up Notifications (Android)

1. Install **Ntfy** from Google Play Store
2. Open the app
3. Tap the **"+"** button
4. Enter your topic name (the NTFY_TOPIC from step 2)
5. Tap "Subscribe"

You'll now receive notifications when your Second Brain has something to tell you!

### 5. Configure Frontend

Edit `/second-brain/script.js` and update the configuration:

```javascript
const CONFIG = {
    WORKER_URL: 'https://second-brain.zammel.workers.dev', // Should be correct
    AUTH_TOKEN: 'YOUR_AUTH_TOKEN_HERE' // Replace with token from step 1
};
```

**Important:** Use the same token you added to GitHub secrets in step 2.

### 6. Commit and Deploy

```bash
git add .
git commit -m "Configure Second Brain with KV namespace and auth token"
git push
```

Once merged to main, GitHub Actions will automatically deploy the worker.

### 7. Test It

1. **Check worker health:**
   ```bash
   curl https://second-brain.zammel.workers.dev/health
   ```
   Should return: `{"status":"ok",...}`

2. **Test capture:**
   ```bash
   curl -X POST https://second-brain.zammel.workers.dev/capture \
     -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"input":"Test capture", "source":"manual"}'
   ```

3. **Open the web interface:**
   Visit: https://arohaislove.github.io/second-brain/

4. **Try voice capture:**
   - Allow microphone permissions
   - Tap "🎤 Speak"
   - Say something like "Buy milk tomorrow"
   - It should auto-send and classify it

### 8. Add to Home Screen (Optional)

For quick access on your phone:

1. Open https://arohaislove.github.io/second-brain/ in Chrome
2. Menu (⋮) → "Add to Home screen"
3. Now you have a one-tap capture app!

## Troubleshooting

### "Configuration needed" error
- Make sure you updated `script.js` with your actual AUTH_TOKEN
- The token should match the one in GitHub secrets

### 401 Unauthorized
- Check that AUTH_TOKEN in script.js matches the GitHub secret
- Format should be just the token, not "Bearer TOKEN"

### Worker not found
- Make sure the PR was merged to main
- Check GitHub Actions for deployment status
- Worker URL should be: https://second-brain.zammel.workers.dev

### Notifications not working
- Make sure Ntfy app is installed and subscribed to your topic
- Topic name in app must match NTFY_TOPIC secret exactly
- Check app permissions (notifications allowed)
- Test manually: `curl -d "Test" ntfy.sh/your-topic-name`

### Voice not working
- Allow microphone permissions in browser
- Voice input only works on HTTPS (GitHub Pages is HTTPS)
- Some browsers don't support speech recognition (Chrome/Edge recommended)

## What Happens Next

Once configured:

1. **Capture anything** via voice or typing
2. **Claude classifies it** into todo/expense/calendar/creative/note/person/project
3. **Every 4 hours** the cron job analyzes your captures
4. **If something needs attention** you get a notification
5. **Claude remembers context** between analysis runs

## Data Export

To backup your data:

```bash
curl https://second-brain.zammel.workers.dev/export \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -o second-brain-backup.json
```

Store this somewhere safe! It's your complete brain export.

## Need Help?

- Check the worker README: `/workers/second-brain/README.md`
- View worker logs: `wrangler tail` (requires Cloudflare access)
- Test endpoints manually using curl examples in the README

---

**You're all set!** Start capturing thoughts and let your Second Brain organize them for you.
