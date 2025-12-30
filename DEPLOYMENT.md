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
**URL:** https://cors-proxy.arohaislove.workers.dev
**Deploy Trigger:** Automatic via GitHub Actions when `workers/` changes
**What it deploys:** Worker code from `workers/cors-proxy/`

## ⚠️ Important: Cloudflare Pages Conflict

**If you're seeing Cloudflare Pages deployment errors**, it's because this repository should NOT be connected to Cloudflare Pages. Here's how to fix it:

### Disconnect from Cloudflare Pages:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** → **Pages**
3. Find the project connected to `arohaislove/arohaislove.github.io`
4. Click on it → **Settings** → **Delete project**
5. Or disable the auto-deployment

**Why?** This repository uses GitHub Pages for hosting the website. Cloudflare Workers (not Pages) is only used for the CORS proxy, which deploys via GitHub Actions.

## How Workers Deploy

When you merge changes to `main` that affect the `workers/` directory:

1. **GitHub Actions** detects the change
2. The workflow `.github/workflows/deploy-workers.yml` runs
3. It uses **Wrangler CLI** to deploy the worker to Cloudflare
4. Uses the secrets: `CF_ACCOUNT_ID` and `CF_API_TOKEN`
5. Worker becomes available at: `https://cors-proxy.arohaislove.workers.dev`

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
