# Work Diary — Setup Guide

A two-sheet Google Sheets work log with voice capture.

## What Gets Built

- **Google Sheet** in your Drive with two tabs:
  - **Diary** — timestamped entries (what happened, thoughts, notes)
  - **Times** — start/end times, duration, activity description
- **Cloudflare Worker** — receives entries from the web app
- **Web app** at `arohaislove.github.io/work-diary/` — voice or typed capture, add to phone home screen

---

## Step 1: Google Apps Script (the tricky bit — do this first)

This creates your Google Sheet and gives the worker somewhere to write.

1. Go to **script.google.com**
2. Click **New project**
3. Name it `Work Diary`
4. Delete everything in the editor
5. Open `/workers/work-diary/google-apps-script.js` from this repo
6. Copy the entire file and paste it into the Apps Script editor
7. Click **Save** (floppy disk icon)
8. In the menu: **Run → Run function → setup**
   - It will ask for permissions — click through and allow
   - This creates your Google Sheet in Drive
   - Check the Execution log — it will show you the spreadsheet URL
9. In the menu: **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**
10. Copy the **Web App URL** — you'll need it in Step 3

---

## Step 2: Add GitHub Secrets

Go to: https://github.com/arohaislove/arohaislove.github.io/settings/secrets/actions

Add two new secrets:

**APPS_SCRIPT_URL**
- The Web App URL from Step 1

**WORK_DIARY_TOKEN**
- Generate a secure token: `openssl rand -hex 32`
- Or use any long random string
- Save it — you'll also need it in Step 4

---

## Step 3: Merge the PR

Once the PR is merged to main, GitHub Actions will automatically deploy the worker to:
```
https://work-diary.zammel.workers.dev
```

---

## Step 4: Configure the Web App

Edit `/work-diary/script.js` and replace `YOUR_TOKEN_HERE` with your WORK_DIARY_TOKEN:

```javascript
const CONFIG = {
    WORKER_URL: 'https://work-diary.zammel.workers.dev',
    AUTH_TOKEN: 'your-actual-token-here'  // ← replace this
};
```

Commit and push this change.

---

## Step 5: Share the Google Sheet

1. Open your Google Sheet (from the URL in Step 1's execution log)
2. Click **Share**
3. Add your employer's email, set to **Viewer**
4. Done — they can read but not edit

---

## Step 6: Add to Phone Home Screen

For quick capture while at work:

1. Open `https://arohaislove.github.io/work-diary/` in Chrome on your phone
2. Menu → **Add to Home Screen**
3. One tap to open, voice button to log

---

## Future: AI Analysis

Once data is in Google Sheets, Claude (or any AI) can:
- Read the CSV export
- Identify patterns in your time use
- Write summaries and titles for diary entries
- Give advice based on your logs

The Second Brain can also be connected to read the sheet and send you insights.

---

## Troubleshooting

**401 Unauthorized** — token in script.js doesn't match WORK_DIARY_TOKEN secret

**Error: APPS_SCRIPT_URL not configured** — add APPS_SCRIPT_URL to GitHub secrets

**Apps Script permission error** — re-run setup() and approve permissions again

**Sheet not found** — run setup() again if the spreadsheet was deleted
