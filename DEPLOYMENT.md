# Deployment Guide

## Repository Deployment Setup

This repository uses **two separate deployment methods**:

### 1. GitHub Pages (Main Site)
**Purpose:** Hosts the portfolio website and all projects
**Platform:** GitHub Pages
**URL:** https://arohaislove.github.io
**Deploy Trigger:** Automatic when pushing to `main` branch
**What it deploys:** HTML/CSS/JS files (index.html, project folders, etc.)

### 2. Cloudflare Workers (CORS Proxy)
**Purpose:** Provides CORS proxy for Ekphrasis and other projects
**Platform:** Cloudflare Workers
**URL:** https://cors-proxy.zammel.workers.dev
**Deploy Trigger:** Automatic via GitHub Actions when `workers/` changes
**What it deploys:** Worker code from `workers/cors-proxy/`

## ⚠️ CRITICAL: Disable Cloudflare Pages Auto-Deploy

**This repository should NEVER deploy via Cloudflare Pages!** It causes conflicts and failures.

### How to Disable Cloudflare Pages Completely:

**Option 1: Delete the Pages Project (Recommended)**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** → **Pages** tab
3. Find the project for `arohaislove/arohaislove.github.io`
4. Click on it
5. Scroll down to **Settings** → **Delete deployment**
6. Confirm deletion

**Option 2: Disable GitHub Integration**
1. In the Pages project settings
2. Go to **Builds & deployments**
3. Click **Configure Production deployments**
4. Disable the GitHub integration
5. Or set **Build command** to: `exit 0`

**Option 3: Remove GitHub Connection**
1. Go to **Account Home** → **Integrations**
2. Find **GitHub** and click **Configure**
3. Remove `arohaislove/arohaislove.github.io` from allowed repositories

**Why this matters:**
- ❌ Cloudflare Pages tries to run `wrangler deploy` from the wrong location
- ❌ This causes "Missing entry-point" errors
- ✅ GitHub Pages hosts the website (correct)
- ✅ GitHub Actions deploys workers (correct)
- ❌ Cloudflare Pages should do nothing (disable it!)

## How Workers Deploy

When you merge changes to `main` that affect the `workers/` directory:

1. **GitHub Actions** detects the change
2. The workflow `.github/workflows/deploy-workers.yml` runs
3. It uses **Wrangler CLI** to deploy the worker to Cloudflare
4. Uses the secrets: `CF_ACCOUNT_ID` and `CF_API_TOKEN`
5. Worker becomes available at: `https://cors-proxy.zammel.workers.dev`

## Manual Worker Deployment (if needed)

If you need to deploy the worker manually:

```bash
cd workers/cors-proxy
npx wrangler login
npx wrangler deploy
```

## Troubleshooting

### "Missing entry-point to Worker script" error
This means Cloudflare Pages is trying to deploy. Disconnect the repo from Cloudflare Pages (see above).

### GitHub Actions workflow not running
- Check that `CF_ACCOUNT_ID` and `CF_API_TOKEN` secrets are set in GitHub Settings
- Verify the workflow file exists at `.github/workflows/deploy-workers.yml`
- Check Actions tab for errors

### Worker not updating
- Manually trigger the workflow: GitHub → Actions → Deploy Cloudflare Workers → Run workflow
- Or manually deploy using the commands above

## Summary

✅ **Use GitHub Pages** for the website
✅ **Use GitHub Actions + Wrangler** for deploying workers
❌ **Do NOT use Cloudflare Pages** for this repository
