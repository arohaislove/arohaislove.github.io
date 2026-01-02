# Vox Setup Guide

This guide will walk you through getting API keys and deploying Vox.

## Step 1: Get Your ElevenLabs API Key

1. **Sign up for ElevenLabs**
   - Go to https://elevenlabs.io
   - Click "Get Started" or "Sign Up"
   - Create a free account

2. **Get your API key**
   - Once logged in, click on your profile icon (top right)
   - Select "Profile + API key"
   - Your API key will be shown
   - Click the copy button to copy it
   - **Keep this safe!** You'll need it in the next step

3. **Free tier info**
   - 10,000 characters per month (free)
   - About 30-50 conversational responses
   - Perfect for testing and demos

## Step 2: Add API Key to GitHub

1. **Go to your GitHub repository**
   - Visit https://github.com/arohaislove/arohaislove.github.io

2. **Navigate to Secrets**
   - Click **Settings** (top menu)
   - In the left sidebar, click **Secrets and variables** → **Actions**

3. **Add the ElevenLabs secret**
   - Click the green **New repository secret** button
   - **Name:** `ELEVENLABS_API_KEY` (must be exactly this)
   - **Value:** Paste your ElevenLabs API key
   - Click **Add secret**

4. **Verify it's added**
   - You should see `ELEVENLABS_API_KEY` in the list of secrets
   - (Note: `ANTHROPIC_API_KEY` should already be there)

## Step 3: Deploy via Pull Request

The code is already in your branch. Now you just need to merge it:

1. **Create a Pull Request**
   - Go to https://github.com/arohaislove/arohaislove.github.io
   - You should see a yellow banner saying "Your recently pushed branches"
   - Click the green **"Compare & pull request"** button

   Or use this direct link (replace BRANCH_NAME with your branch):
   ```
   https://github.com/arohaislove/arohaislove.github.io/compare/main...BRANCH_NAME?expand=1
   ```

2. **Review the changes**
   - You should see:
     - New folder: `vox/` with index.html, styles.css, script.js, README.md
     - New folder: `workers/vox-api/` with index.js, wrangler.toml, README.md
     - Updated: `.github/workflows/deploy-workers.yml` (ElevenLabs support)
     - Updated: `index.html` (link to Vox project)

3. **Merge the PR**
   - Click the green **"Merge pull request"** button
   - Confirm the merge

## Step 4: Wait for Deployment

GitHub Actions will automatically:

1. **Deploy the frontend** (GitHub Pages)
   - Usually takes 1-2 minutes
   - Available at: https://arohaislove.github.io/vox/

2. **Deploy the worker** (Cloudflare)
   - Discovers the `vox-api` worker
   - Configures both API keys (Anthropic + ElevenLabs)
   - Deploys to: https://vox-api.zammel.workers.dev

**Check deployment status:**
- Go to the **Actions** tab in GitHub
- Look for the "Deploy Cloudflare Workers" workflow
- It should show green checkmarks when complete (usually 2-3 minutes)

## Step 5: Test Vox

1. **Visit the live app**
   - https://arohaislove.github.io/vox/

2. **Try a conversation**
   - Type: "Hello! Tell me about the ocean."
   - The AI should respond with text
   - You should hear the response spoken (might auto-detect "Ship's Captain" accent)

3. **Test voice input** (Chrome/Edge/Safari only)
   - Click the microphone button
   - Allow microphone access
   - Speak a message
   - It should transcribe and send

4. **Try manual accent selection**
   - Toggle OFF "Auto-detect accent"
   - Expand the "Character" category
   - Click "Zen Monk"
   - Type: "What is the meaning of life?"
   - Response should be spoken in a Zen Monk style

## Troubleshooting

### Worker deployment failed?

Check the GitHub Actions logs:
1. Go to **Actions** tab
2. Click on the failed workflow
3. Check the error message

Common issues:
- **ELEVENLABS_API_KEY not set:** Go back to Step 2 and add it
- **Invalid API key:** Double-check you copied it correctly from ElevenLabs
- **Cloudflare credentials missing:** These should already be set up (CF_API_KEY, CF_ACCOUNT_ID)

### No audio playing?

- Check browser console for errors (F12)
- Verify ElevenLabs API key is correct
- Check you have ElevenLabs credits remaining (visit elevenlabs.io)
- Try a different browser

### Voice input not working?

- Grant microphone permissions when prompted
- Use Chrome, Edge, or Safari (best support)
- Check microphone works in other apps
- Try typing instead as a fallback

### AI not responding?

- Check network tab (F12) for API errors
- Verify Anthropic API key is configured
- Check you have Anthropic credits remaining

## API Costs

### ElevenLabs Free Tier
- 10,000 characters/month
- ~30-50 messages (depending on length)
- Resets monthly

### Anthropic Credits
- $5 free credit on signup
- Sonnet 4: ~$3 per 1M input tokens, ~$15 per 1M output tokens
- Typical conversation: ~100-500 tokens per exchange
- Your free credit will last for many conversations

### When you exceed free tiers

If you love Vox and use it a lot:
- ElevenLabs: ~$5/month for 30K characters (Starter plan)
- Anthropic: Pay-as-you-go, usually $0.01-0.05 per conversation

## Advanced: ElevenLabs Voice Customization

Currently, Vox uses a default voice for all accents. For more distinct voices:

1. **Explore ElevenLabs voices**
   - Visit https://elevenlabs.io/voice-library
   - Browse pre-made voices
   - Each has a unique voice ID

2. **Update worker code**
   - Edit `workers/vox-api/index.js`
   - Map accent styles to specific voice IDs
   - Example:
     ```javascript
     const voiceMap = {
       "Ship's Captain": "voice-id-for-captain",
       "Zen Monk": "voice-id-for-monk",
       // ...
     };
     const voiceId = voiceMap[accentStyle] || defaultVoiceId;
     ```

3. **Voice cloning (paid)**
   - Clone your own voice or create custom characters
   - Professional plan required

## Getting Help

If you encounter issues:

1. Check the README.md in the vox/ folder
2. Check the worker README.md in workers/vox-api/
3. Review GitHub Actions logs for deployment errors
4. Check browser console (F12) for JavaScript errors
5. Verify API keys are correctly set in GitHub Secrets

## Next Steps

Once Vox is working:

- Try different accent styles
- Test with various conversation topics
- Adjust accent strength slider
- Share with friends!
- Consider upgrading if you love it and want more usage

Enjoy your conversational AI with dynamic accents! 🎙️✨
