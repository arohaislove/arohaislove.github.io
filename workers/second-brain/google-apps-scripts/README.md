# Google Apps Scripts for Second Brain

These scripts run inside Google Apps Script (script.google.com) as **you**, which means they can read your Gmail and YouTube without you needing to set up OAuth credentials or manage API keys in the worker.

## Why Apps Script?

- No Google Cloud project needed
- No OAuth token management
- Works on mobile (script.google.com works fine in Android browser)
- Google handles authentication — the scripts just run as your Google account
- Free tier is generous (6 minutes/execution, 20 minutes/day trigger time)

## Scripts

| File | What it does | Trigger |
|------|-------------|---------|
| `gmail-sync.gs` | Reads Gmail (sent + received), POSTs to `/ingest-email` | Hourly |
| `youtube-sync.gs` | Reads liked videos + your uploads, POSTs to `/ingest-youtube` | Daily |

## Quick Setup

### Prerequisites

You need your Second Brain `AUTH_TOKEN` — it's the same token you use in the capture interface. If you don't have it, check your GitHub secrets or the Cloudflare Worker settings.

### Step 1: Create the Apps Script project

1. Open https://script.google.com on your phone or computer
2. Tap **"New project"** (top left, or the `+` button on mobile)
3. Rename the project: tap "Untitled project" at the top → type "Second Brain Sync"

### Step 2: Add the scripts

For **Gmail sync**:
1. In the editor, click the default `Code.gs` file
2. Select all and delete the existing code
3. Copy-paste the full contents of `gmail-sync.gs`
4. Click the floppy disk icon (💾) to save

For **YouTube sync**:
1. Click **"+"** next to "Files" in the left panel → select "Script"
2. Name the new file `youtube-sync`
3. Copy-paste the full contents of `youtube-sync.gs` into it
4. Enable the YouTube advanced service:
   - Click **"+"** next to "Services" in the left panel
   - Find **"YouTube Data API v3"** → click "Add"
5. Save

### Step 3: Add your AUTH_TOKEN

1. Click the **gear icon (⚙️)** → "Project settings"
2. Scroll to **"Script properties"**
3. Click **"Add script property"**
   - Key: `AUTH_TOKEN`
   - Value: `your-actual-auth-token-here`
4. Click "Save script properties"

### Step 4: Run once to grant permissions

1. Select **`syncGmail`** from the function dropdown (top bar, between the debug/run buttons)
2. Click **▶ Run**
3. A dialog will ask for permissions — click through and approve (it will ask to access Gmail)
4. Check the execution log at the bottom — you should see "Gmail sync complete"

Repeat for YouTube:
1. Select **`syncYoutube`** from the dropdown
2. Click **▶ Run**
3. Approve permissions (Gmail + YouTube)

### Step 5: Do the historical batch import

Before setting up recurring triggers, import your existing emails/videos:

**Gmail historical import** (last 30 days by default):
1. Select **`historicalSync`** from the dropdown
2. Click ▶ Run
3. Wait for it to finish — this may take a few minutes if you have lots of email
4. Check the execution log for the count

To go further back, edit the `historicalSync()` call in the script:
```javascript
function historicalSync() {
  // Change 30 to however many days you want to go back (max ~90 is practical)
  historicalSync(60);
}
```

**YouTube** doesn't need a historical import — it just syncs whatever is currently liked/uploaded.

### Step 6: Set up recurring triggers

**Gmail (every hour):**
1. Click the **clock icon (⏰)** in the left sidebar
2. Click **"+ Add Trigger"** (bottom right)
3. Configure:
   - Function: `syncGmail`
   - Deployment: Head
   - Event source: Time-driven
   - Type: Hour timer
   - Interval: Every hour
4. Click "Save"

**YouTube (daily):**
1. Click **"+ Add Trigger"** again
2. Configure:
   - Function: `syncYoutube`
   - Deployment: Head
   - Event source: Time-driven
   - Type: Day timer
   - Time of day: 6am–7am (or whenever)
3. Click "Save"

## Verification

After running the sync, check your Second Brain dashboard — you should see new items appearing:
- Emails show up as `type: comms` with `channel: email`
- YouTube items show up as `type: youtube`

You can also filter items:
```
GET /items?type=comms
GET /items?type=youtube
```

## Troubleshooting

**"AUTH_TOKEN not set"** — Go to Project Settings → Script Properties and add the token.

**Permission errors** — Run each function manually once and click through all permission prompts.

**"YouTube.Videos is not defined"** — You need to add the YouTube Data API v3 service. See Step 2 above.

**Emails not appearing** — Check the execution log (View → Executions) for errors. The most common issue is the AUTH_TOKEN being wrong.

**Too many emails** — The Gmail sync fetches up to 100 threads per run. For very large mailboxes, the first run may time out (6-minute limit). It will pick up where it left off on the next trigger run since it uses GMAIL_LAST_SYNC to track progress.

## Direct OAuth Alternative

If you prefer the worker to pull data directly (no Apps Script dependency), you can use the `GET /gmail-sync` and `GET /youtube-sync` endpoints on the worker — but these require you to:

1. Create a Google Cloud project
2. Enable Gmail API + YouTube Data API v3
3. Create OAuth 2.0 credentials
4. Get a refresh token via the OAuth Playground (https://developers.google.com/oauthplayground)
5. Store `GMAIL_REFRESH_TOKEN`, `YOUTUBE_REFRESH_TOKEN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` as GitHub secrets → will be auto-deployed to the worker

The Apps Script approach above is recommended for most users since it's simpler to set up.
