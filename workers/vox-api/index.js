/**
 * Vox API Worker
 * Version: 2.0.0 - Multiple voices for vivid accent variety!
 *
 * Handles both Claude API (conversational responses) and ElevenLabs API (text-to-speech)
 * for the Vox conversational AI with dynamic accents.
 *
 * Endpoints:
 * - POST /chat - Generate conversational responses using Claude
 * - POST /speak - Convert text to speech using ElevenLabs with accent/style
 * - POST /detect-accent - Analyze conversation and suggest appropriate accent
 *
 * Used by: Vox project
 */

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed. Only POST requests are supported.', {
        status: 405,
        headers: corsHeaders()
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Route to appropriate handler
      if (path === '/chat' || path === '/chat/') {
        return await handleChat(request, env);
      } else if (path === '/speak' || path === '/speak/') {
        return await handleSpeak(request, env);
      } else if (path === '/detect-accent' || path === '/detect-accent/') {
        return await handleDetectAccent(request, env);
      } else {
        return new Response(JSON.stringify({
          error: 'Not found',
          message: 'Valid endpoints: /chat, /speak, /detect-accent'
        }), {
          status: 404,
          headers: {
            ...corsHeaders(),
            'Content-Type': 'application/json',
          }
        });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        error: 'Worker error',
        message: error.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders(),
          'Content-Type': 'application/json',
        }
      });
    }
  }
};

/**
 * Handle chat endpoint - Claude API
 */
async function handleChat(request, env) {
  // Check API key
  if (!env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({
      error: 'Configuration error',
      message: 'ANTHROPIC_API_KEY not configured'
    }), {
      status: 500,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
      }
    });
  }

  try {
    const body = await request.json();
    const { messages, system } = body;

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: messages,
        system: system || 'You are Vox, a conversational AI assistant. Be helpful, friendly, and engaging in your responses.'
      })
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({
      error: 'Chat error',
      message: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
      }
    });
  }
}

/**
 * Handle speak endpoint - ElevenLabs API
 */
async function handleSpeak(request, env) {
  // Check API key
  if (!env.ELEVENLABS_API_KEY) {
    return new Response(JSON.stringify({
      error: 'Configuration error',
      message: 'ELEVENLABS_API_KEY not configured'
    }), {
      status: 500,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
      }
    });
  }

  try {
    const body = await request.json();
    const { text, voiceSettings } = body;

    // Map accent styles to specific ElevenLabs voice IDs for variety
    // These are pre-made voices from ElevenLabs with different characteristics
    const accentVoiceMap = {
      // British/UK voices
      'Victorian Butler': 'VR6AewLTigWG4xSOukaG', // Arnold - British
      'Shakespearean': 'VR6AewLTigWG4xSOukaG', // Arnold - British
      'Ship\'s Captain': 'TxGEqnHWrfWFTfGW9XjX', // Josh - Deep, authoritative
      'Welsh': 'VR6AewLTigWG4xSOukaG', // Arnold - British
      'Scottish Highlander': 'VR6AewLTigWG4xSOukaG', // Arnold - British

      // American voices - Grumpy/Gruff Men
      '1920s Chicago Gangster': 'TxGEqnHWrfWFTfGW9XjX', // Josh - Deep male
      '1940s Newsreader': 'CwhRBWXzGAHq8TQ4Fs17', // Roger - Professional
      '1950s Jazz DJ': 'CwhRBWXzGAHq8TQ4Fs17', // Roger - Smooth
      'Texas Auctioneer': 'TxGEqnHWrfWFTfGW9XjX', // Josh - Energetic
      'Drunk Poet': 'pNInz6obpgDQGcFmaJgB', // Adam - Gruff, weary
      'Stern Bureaucrat': 'CwhRBWXzGAHq8TQ4Fs17', // Roger - Rigid, formal
      'Whispering Conspiracist': 'pNInz6obpgDQGcFmaJgB', // Adam - Paranoid, intense

      // Female voices for variety
      'Irish Storyteller': 'EXAVITQu4vr4xnSDxMaL', // Bella - Soft, storytelling
      'Italian Nonna': 'EXAVITQu4vr4xnSDxMaL', // Bella - Warm
      'Berlin Cabaret Singer': 'EXAVITQu4vr4xnSDxMaL', // Bella - Expressive

      // Character voices - More Grumpy Men!
      'Zen Monk': 'pNInz6obpgDQGcFmaJgB', // Adam - Calm, deep
      'Ancient Greek Orator': 'pNInz6obpgDQGcFmaJgB', // Adam - Authoritative
      'Medieval Herald': 'TxGEqnHWrfWFTfGW9XjX', // Josh - Booming
      'Soviet Broadcaster': 'pNInz6obpgDQGcFmaJgB', // Adam - Strong, serious
      'Sports Commentator': 'TxGEqnHWrfWFTfGW9XjX', // Josh - Energetic, loud

      // Mood-based
      'Warm & Gentle': 'EXAVITQu4vr4xnSDxMaL', // Bella - Soft female
      'Urgent': 'TxGEqnHWrfWFTfGW9XjX', // Josh - Intense male
      'Formal': 'CwhRBWXzGAHq8TQ4Fs17', // Roger - Professional
      'Playful': '21m00Tcm4TlvDq8ikWAM', // Rachel - Cheerful
      'Melancholic': 'pNInz6obpgDQGcFmaJgB', // Adam - Sad, weary
      'Conspiratorial': 'pNInz6obpgDQGcFmaJgB', // Adam - Secretive
    };

    // Get voice ID based on accent, with fallback
    const accentStyle = voiceSettings?.accentStyle || 'Warm & Gentle';
    const voiceId = accentVoiceMap[accentStyle] || voiceSettings?.voiceId || '21m00Tcm4TlvDq8ikWAM';

    // Make accent strength slider MORE DRAMATIC
    // Map 0-100 slider to more extreme stability/similarity values
    const accentStrength = voiceSettings?.style || 0;

    // Low strength (0-30): Very stable, neutral
    // Medium strength (30-70): Moderate variation
    // High strength (70-100): Wild, exaggerated
    let stability, similarityBoost;

    if (accentStrength < 0.3) {
      // Subtle - very consistent, neutral
      stability = 0.75;
      similarityBoost = 0.5;
    } else if (accentStrength < 0.7) {
      // Medium - balanced
      stability = 0.5;
      similarityBoost = 0.75;
    } else {
      // Strong - exaggerated, dramatic
      stability = 0.3;
      similarityBoost = 0.9;
    }

    // Prepare voice settings
    const style = voiceSettings?.style ?? 0.0;
    const useSpeakerBoost = voiceSettings?.use_speaker_boost ?? true;

    // Call ElevenLabs API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_turbo_v2_5', // Updated to free-tier compatible model
        voice_settings: {
          stability: stability,
          similarity_boost: similarityBoost,
          style: style,
          use_speaker_boost: useSpeakerBoost
        }
      })
    });

    // ElevenLabs returns audio data (MP3)
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${errorText}`);
    }

    // Get audio as array buffer
    const audioData = await response.arrayBuffer();

    // Return audio with CORS headers
    return new Response(audioData, {
      status: 200,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'audio/mpeg',
      }
    });
  } catch (error) {
    console.error('Speak error:', error);
    return new Response(JSON.stringify({
      error: 'Speak error',
      message: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
      }
    });
  }
}

/**
 * Handle accent detection - analyzes conversation context
 */
async function handleDetectAccent(request, env) {
  if (!env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({
      error: 'Configuration error',
      message: 'ANTHROPIC_API_KEY not configured'
    }), {
      status: 500,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
      }
    });
  }

  try {
    const body = await request.json();
    const { conversationHistory } = body;

    // Use Claude to analyze the conversation and suggest an accent
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [{
          role: 'user',
          content: `Based on the following conversation, suggest an appropriate accent or voice style. Consider the topic, mood, formality, and context.

Conversation:
${conversationHistory}

Available styles:
- Era: Shakespearean, Victorian Butler, 1920s Chicago, 1940s Newsreader, 1950s Jazz DJ, Medieval Herald, Ancient Greek Orator, 1970s Sci-Fi AI
- Regional: Welsh, Irish Storyteller, Scottish Highlander, Jamaican, Nigerian English, Cajun Louisiana, Newfoundland Canadian, Mumbai English, Singaporean English, German Physicist, Parisian Intellectual, French Resistance Fighter, Bavarian, Quebec French, Kiwi Casual, Southland NZ, Hokianga/Tai Tokerau, West Coast NZ, Te Reo-inflected English, 1950s NZ Newsreader
- Character: Ship's Captain, Zen Monk, Italian Nonna, Texas Auctioneer, Soviet Broadcaster, Drunk Poet, Whispering Conspiracist, Sports Commentator, Stern Bureaucrat, Berlin Cabaret Singer
- Mood: Warm & Gentle, Urgent, Formal, Playful, Melancholic, Conspiratorial

Respond with ONLY the style name from the list above that best fits. No explanation.`
        }],
        system: 'You are an accent detection system. Return only the suggested style name, nothing else.'
      })
    });

    const data = await response.json();

    // Extract suggested style from Claude's response
    const suggestedStyle = data.content?.[0]?.text?.trim() || 'Warm & Gentle';

    return new Response(JSON.stringify({
      suggestedStyle: suggestedStyle
    }), {
      status: 200,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
      }
    });
  } catch (error) {
    console.error('Detect accent error:', error);
    return new Response(JSON.stringify({
      error: 'Detection error',
      message: error.message,
      suggestedStyle: 'Warm & Gentle' // Fallback
    }), {
      status: 500,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
      }
    });
  }
}

/**
 * Generate CORS headers
 */
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * Handle CORS preflight OPTIONS requests
 */
function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}
