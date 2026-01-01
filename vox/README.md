# Vox - Conversational AI with Dynamic Accents

A web-based conversational AI that speaks with dynamic accents and voice styles. Built with Claude for intelligent responses and ElevenLabs for realistic text-to-speech.

**Live Demo:** https://arohaislove.github.io/vox/

## Features

- **Voice Input:** Speak to the AI using browser speech recognition
- **Text Input:** Or type your messages
- **Dynamic Accents:** AI responses spoken in contextually appropriate accents
- **Auto-Detection:** Automatically suggests accents based on conversation topic and mood
- **Manual Override:** Choose from 50+ accent styles across 4 categories:
  - **Era:** Shakespearean, Victorian Butler, 1920s Chicago, Medieval Herald, and more
  - **Regional:** Welsh, Irish, Scottish, Jamaican, Kiwi, Te Reo-inflected English, and more
  - **Character:** Ship's Captain, Zen Monk, Italian Nonna, Sports Commentator, and more
  - **Mood:** Warm & Gentle, Urgent, Formal, Playful, Melancholic, Conspiratorial
- **Accent Strength Slider:** Adjust from subtle to strong
- **Conversation History:** Full chat thread displayed on screen
- **Mobile Friendly:** Responsive design works on all devices

## How It Works

### Auto-Detect Mode (Default)

When auto-detect is enabled, Vox analyzes your conversation and automatically selects appropriate accents:

- Nautical topics → Ship's Captain
- Philosophy/deep questions → Parisian Intellectual
- Historical discussions → Era-appropriate accent
- Casual chat → Relaxed regional accent (Kiwi, Irish, etc.)
- Late night reflective → Warm & Gentle

The accent shifts are subtle and contextual, not jarring.

### Manual Mode

Toggle off auto-detect to manually select any accent style. Click on accent buttons in the sidebar to choose your preferred voice.

### Voice Controls

- **Microphone Button:** Click to speak your message (uses browser's speech recognition)
- **Type:** Or simply type in the input field
- **Send:** Click send or press Enter to submit

## Tech Stack

### Frontend
- Pure HTML/CSS/JavaScript (no frameworks)
- Web Speech API for voice input
- Hosted on GitHub Pages

### Backend
- **Cloudflare Worker** (`vox-api`) handles:
  - Claude API calls for AI responses
  - ElevenLabs API calls for text-to-speech
  - Accent detection logic
  - CORS handling
- Worker URL: `https://vox-api.zammel.workers.dev`

### APIs Used
- **Claude (Anthropic):** Sonnet 4 for conversational responses
- **ElevenLabs:** Text-to-speech with voice styling

## Setup Instructions

### Prerequisites

1. **Anthropic API Key**
   - Sign up at https://console.anthropic.com
   - Create an API key
   - Free tier available, Sonnet is cost-effective

2. **ElevenLabs API Key**
   - Sign up at https://elevenlabs.io
   - Get your API key from Settings → API Keys
   - Free tier: 10,000 characters/month

### Deployment Steps

#### Step 1: Add ElevenLabs API Key to GitHub

The Anthropic API key is already configured. You need to add the ElevenLabs key:

1. Go to your GitHub repository: https://github.com/arohaislove/arohaislove.github.io
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `ELEVENLABS_API_KEY`
5. Value: Your ElevenLabs API key
6. Click **Add secret**

#### Step 2: Update GitHub Actions Workflow

The `.github/workflows/deploy-workers.yml` file needs to inject the `ELEVENLABS_API_KEY` secret into the vox-api worker.

Open `.github/workflows/deploy-workers.yml` and find the section that injects secrets. Add the ElevenLabs key injection similar to how `ANTHROPIC_API_KEY` is handled.

Look for this pattern:
```yaml
- name: Set secrets for workers
  run: |
    if grep -q "ANTHROPIC_API_KEY" workers/${{ matrix.worker }}/index.js; then
      echo "${{ secrets.ANTHROPIC_API_KEY }}" | wrangler secret put ANTHROPIC_API_KEY --name ${{ matrix.worker }}
    fi
```

Add after it:
```yaml
    if grep -q "ELEVENLABS_API_KEY" workers/${{ matrix.worker }}/index.js; then
      echo "${{ secrets.ELEVENLABS_API_KEY }}" | wrangler secret put ELEVENLABS_API_KEY --name ${{ matrix.worker }}
    fi
```

#### Step 3: Push to Main Branch

Once your pull request is merged to `main`, GitHub Actions will:

1. Discover the `vox-api` worker
2. Configure both API keys (Anthropic and ElevenLabs)
3. Deploy the worker to Cloudflare
4. Make it available at `https://vox-api.zammel.workers.dev`

The frontend is automatically live on GitHub Pages at `https://arohaislove.github.io/vox/`

### Step 4: Test the Deployment

1. Visit https://arohaislove.github.io/vox/
2. Type or speak a message
3. The AI should respond and speak back
4. Try different topics to see accent auto-detection in action

## Usage Tips

### Getting Started

1. **Start with auto-detect ON** to experience the dynamic accent feature
2. Ask about different topics:
   - "Tell me about sailing the seven seas" → Ship's Captain
   - "What is the meaning of life?" → Philosophical accent
   - "G'day, how's it going?" → Casual Kiwi
3. Watch the "Current Style" badge update automatically

### Manual Control

1. Toggle OFF auto-detect
2. Expand accent categories (Era, Regional, Character, Mood)
3. Click any accent button to select it
4. Adjust the accent strength slider
5. The next response will use your chosen style

### Voice Input

1. Click the microphone button
2. Allow microphone access if prompted
3. Speak your message clearly
4. The text will appear in the input field
5. Message is sent automatically when you finish speaking

**Note:** Voice input requires a modern browser (Chrome, Edge, Safari)

### Accent Strength

- **0-30% (Subtle):** Slight inflection, mostly neutral
- **40-60% (Moderate):** Noticeable accent, still clear (default)
- **70-100% (Strong):** Very pronounced accent

## Browser Compatibility

- **Voice Input:** Chrome, Edge, Safari (requires Web Speech API)
- **Voice Output:** All modern browsers (plays MP3 audio)
- **Chat Interface:** All modern browsers

## Troubleshooting

### No audio output?
- Check that ElevenLabs API key is configured correctly
- Check browser console for errors
- Verify you have ElevenLabs credits remaining

### Voice input not working?
- Grant microphone permissions
- Use Chrome, Edge, or Safari (Firefox doesn't support Web Speech API well)
- Check that mic is working in other apps

### AI not responding?
- Check that Anthropic API key is configured
- Check network tab for API errors
- Verify you have Anthropic API credits

### Worker deployment failed?
- Check GitHub Actions logs
- Ensure both API keys are set in GitHub Secrets
- Verify worker code has no syntax errors

## Cost Estimates

### Free Tier Usage

**ElevenLabs Free Tier:**
- 10,000 characters/month
- ~30-50 messages depending on length
- Great for testing and demos

**Anthropic Free Tier:**
- $5 credit on signup
- Sonnet: ~$3 per 1M input tokens, ~$15 per 1M output tokens
- Typical conversation: ~100-500 tokens
- Credits last for many conversations

### Paid Usage

If you exceed free tiers, costs are very reasonable:
- ElevenLabs: ~$5/month for 30K characters (Starter plan)
- Anthropic: Pay-as-you-go, ~$0.01-0.05 per conversation

## Future Enhancements

Possible improvements:
- Map accent styles to specific ElevenLabs voice IDs for more distinct voices
- Add voice cloning for custom accents
- Save conversation history to localStorage
- Export conversation transcripts
- Add more accent categories (historical figures, fictional characters)
- Implement voice activity detection for hands-free mode
- Add accent mixing (e.g., "Victorian Butler meets Jazz DJ")

## Credits

- **Claude (Anthropic):** Conversational AI
- **ElevenLabs:** Text-to-speech engine
- **Cloudflare Workers:** Serverless backend
- **GitHub Pages:** Static hosting

## License

Part of the arohaislove.github.io portfolio. Feel free to learn from the code!
