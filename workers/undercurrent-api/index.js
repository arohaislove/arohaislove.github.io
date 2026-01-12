/**
 * Undercurrent API Worker
 *
 * Provides backend API for the Undercurrent messaging app with
 * real-time psychological and linguistic analysis.
 *
 * Used by: undercurrent/ project
 */

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Route handling
      if (path === '/conversation' && request.method === 'POST') {
        return await createConversation(env);
      }

      const conversationMatch = path.match(/^\/conversation\/([^/]+)$/);
      if (conversationMatch && request.method === 'GET') {
        return await getConversation(env, conversationMatch[1]);
      }

      const messagesMatch = path.match(/^\/conversation\/([^/]+)\/messages$/);
      if (messagesMatch) {
        if (request.method === 'GET') {
          return await getMessages(env, messagesMatch[1]);
        } else if (request.method === 'POST') {
          return await sendMessage(env, messagesMatch[1], request);
        }
      }

      const analyzeMatch = path.match(/^\/conversation\/([^/]+)\/analyze$/);
      if (analyzeMatch && request.method === 'POST') {
        return await analyzeOnly(env, analyzeMatch[1], request);
      }

      return jsonResponse({ error: 'Not found' }, 404);
    } catch (error) {
      console.error('Error:', error);
      return jsonResponse({
        error: error.message || 'Internal server error'
      }, 500);
    }
  }
};

/**
 * Create a new conversation
 */
async function createConversation(env) {
  const id = generateId();

  await env.DB.prepare(
    'INSERT INTO conversations (id) VALUES (?)'
  ).bind(id).run();

  return jsonResponse({
    id,
    url: `${id}`
  }, 201);
}

/**
 * Get conversation metadata
 */
async function getConversation(env, id) {
  const result = await env.DB.prepare(
    'SELECT * FROM conversations WHERE id = ?'
  ).bind(id).first();

  if (!result) {
    return jsonResponse({ error: 'Conversation not found' }, 404);
  }

  return jsonResponse(result);
}

/**
 * Get all messages in a conversation
 */
async function getMessages(env, conversationId) {
  const messages = await env.DB.prepare(
    'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC'
  ).bind(conversationId).all();

  // Parse JSON analysis for each message
  const parsed = messages.results.map(msg => ({
    ...msg,
    analysis: msg.analysis ? JSON.parse(msg.analysis) : null
  }));

  return jsonResponse(parsed);
}

/**
 * Analyze a draft message without sending (preview mode)
 */
async function analyzeOnly(env, conversationId, request) {
  const body = await request.json();
  const { sender, content } = body;

  if (!sender || !content) {
    return jsonResponse({
      error: 'Missing required fields: sender, content'
    }, 400);
  }

  // Check conversation exists
  const conversation = await env.DB.prepare(
    'SELECT * FROM conversations WHERE id = ?'
  ).bind(conversationId).first();

  if (!conversation) {
    return jsonResponse({ error: 'Conversation not found' }, 404);
  }

  // Get conversation history for context
  const history = await env.DB.prepare(
    'SELECT sender, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 20'
  ).bind(conversationId).all();

  // Analyze the message (but don't store it)
  const analysis = await analyzeMessage(env, content, history.results, sender);

  return jsonResponse({
    analysis,
    content,
    sender
  });
}

/**
 * Send a new message (with analysis)
 */
async function sendMessage(env, conversationId, request) {
  const body = await request.json();
  const { sender, content } = body;

  if (!sender || !content) {
    return jsonResponse({
      error: 'Missing required fields: sender, content'
    }, 400);
  }

  // Check conversation exists
  const conversation = await env.DB.prepare(
    'SELECT * FROM conversations WHERE id = ?'
  ).bind(conversationId).first();

  if (!conversation) {
    return jsonResponse({ error: 'Conversation not found' }, 404);
  }

  // Get conversation history for context
  const history = await env.DB.prepare(
    'SELECT sender, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 20'
  ).bind(conversationId).all();

  // Analyze the message
  const analysis = await analyzeMessage(env, content, history.results, sender);

  // Store the message
  const messageId = generateId();
  await env.DB.prepare(
    'INSERT INTO messages (id, conversation_id, sender, content, analysis) VALUES (?, ?, ?, ?, ?)'
  ).bind(
    messageId,
    conversationId,
    sender,
    content,
    JSON.stringify(analysis)
  ).run();

  return jsonResponse({
    id: messageId,
    conversation_id: conversationId,
    sender,
    content,
    analysis,
    created_at: Math.floor(Date.now() / 1000)
  }, 201);
}

/**
 * Analyze a message using Claude API
 */
async function analyzeMessage(env, message, conversationHistory, sender) {
  // Check if API key exists
  if (!env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not configured');
    return getFallbackAnalysis();
  }

  // Build conversation context
  let contextMessages = conversationHistory.map(msg =>
    `${msg.sender}: ${msg.content}`
  ).join('\n');

  if (contextMessages) {
    contextMessages = `Conversation history:\n${contextMessages}\n\n`;
  }

  const prompt = `${contextMessages}Current message from ${sender}: "${message}"

Analyze this message within the conversation context using multiple frameworks. Return ONLY valid JSON with this exact structure:

{
  "transactional_analysis": {
    "ego_state": "Parent|Adult|Child",
    "ego_subtype": "Nurturing Parent|Critical Parent|Free Child|Adapted Child|Adult",
    "invited_response": "Parent|Adult|Child",
    "transaction_type": "complementary|crossed|ulterior"
  },
  "speech_act": {
    "primary": "assertive|directive|commissive|expressive|declarative",
    "specific": "e.g., request, promise, complaint, greeting, threat, offer"
  },
  "discourse": {
    "markers": ["hedging", "topic_shift", "repair", "interruption", "backchannel"],
    "topic_control": "initiating|maintaining|yielding|competing"
  },
  "power_dynamics": {
    "move": "one-up|one-down|level",
    "indicators": ["e.g., advice-giving", "self-deprecation", "agreement"]
  },
  "tone": {
    "overall": "friendly|neutral|formal|playful|serious|aggressive|compassionate",
    "warmth": "warm|neutral|cold"
  },
  "formality": {
    "level": "very_formal|formal|neutral|casual|very_casual",
    "markers": ["e.g., contractions, slang, professional vocabulary, hedging"]
  },
  "subtext": "One sentence describing what this message is really doing beneath the surface"
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Claude API error: ${response.status}`, errorBody);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.content[0].text;

    // Parse the JSON response
    const parsed = JSON.parse(analysisText);
    return parsed;
  } catch (error) {
    console.error('Analysis error:', error.message, error.stack);
    return getFallbackAnalysis();
  }
}

/**
 * Get fallback analysis when API fails
 */
function getFallbackAnalysis() {
  return {
    transactional_analysis: {
      ego_state: "Adult",
      ego_subtype: "Adult",
      invited_response: "Adult",
      transaction_type: "complementary"
    },
    speech_act: {
      primary: "assertive",
      specific: "statement"
    },
    discourse: {
      markers: [],
      topic_control: "maintaining"
    },
    power_dynamics: {
      move: "level",
      indicators: []
    },
    tone: {
      overall: "neutral",
      warmth: "neutral"
    },
    formality: {
      level: "neutral",
      markers: []
    },
    subtext: "Analysis unavailable - API error"
  };
}

/**
 * Generate a random ID
 */
function generateId() {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

/**
 * Create a JSON response with CORS headers
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json'
    }
  });
}

/**
 * CORS headers for browser requests
 */
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400'
  };
}
