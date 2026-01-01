/**
 * Vox API Worker
 * Version: 1.0.2 - Testing ElevenLabs API key deployment
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

    // ElevenLabs uses different voice IDs for different styles
    // For now, we'll use a default voice and adjust settings
    // In production, you'd map accent styles to specific voice IDs
    const voiceId = voiceSettings?.voiceId || '21m00Tcm4TlvDq8ikWAM'; // Default voice (Rachel)

    // Prepare voice settings
    const stability = voiceSettings?.stability ?? 0.5;
    const similarityBoost = voiceSettings?.similarity_boost ?? 0.75;
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
        model_id: 'eleven_monolingual_v1',
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
