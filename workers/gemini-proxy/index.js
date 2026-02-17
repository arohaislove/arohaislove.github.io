/**
 * GEMINI PROXY - Cloudflare Worker
 *
 * Proxies conversations to Google's Gemini API and stores every exchange
 * in the Second Brain's KV store. This is how Gemini conversations get
 * captured automatically - by being the middleman.
 *
 * Every message you send, every response Gemini gives, goes into the pool.
 *
 * Endpoints:
 *   POST /chat        - Send a message to Gemini and get a response (stored in KV)
 *   GET  /history     - Get conversation history for current session
 *   POST /session     - Start a new conversation session
 *   GET  /sessions    - List all sessions
 *   GET  /health      - Health check
 *
 * Secrets required:
 *   - GEMINI_API_KEY: Google AI Studio API key
 *   - AUTH_TOKEN: Bearer token for authentication (shared with Second Brain)
 *
 * KV Binding:
 *   BRAIN_KV - Second Brain's KV namespace (the shared pool)
 *
 * Used by: second-brain/gemini.html
 */

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Health check - no auth required
    if (path === '/health') {
      return jsonResponse({
        status: 'ok',
        timestamp: new Date().toISOString(),
        geminiConfigured: !!env.GEMINI_API_KEY,
        kvConfigured: !!env.BRAIN_KV
      });
    }

    // All other endpoints require auth
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || token !== env.AUTH_TOKEN) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    if (path === '/chat' && request.method === 'POST') {
      return await handleChat(request, env);
    }

    if (path === '/history' && request.method === 'GET') {
      const sessionId = url.searchParams.get('session');
      return await handleHistory(sessionId, env);
    }

    if (path === '/session' && request.method === 'POST') {
      return await handleNewSession(request, env);
    }

    if (path === '/sessions' && request.method === 'GET') {
      return await handleListSessions(env);
    }

    return jsonResponse({ error: 'Not found' }, 404);
  }
};

// ─── CHAT HANDLER ────────────────────────────────────────────

async function handleChat(request, env) {
  const body = await request.json();
  const { message, sessionId = null, systemPrompt = null } = body;

  if (!message || typeof message !== 'string') {
    return jsonResponse({ error: 'Missing or invalid message' }, 400);
  }

  if (!env.GEMINI_API_KEY) {
    return jsonResponse({
      error: 'Gemini API key not configured. Add GEMINI_API_KEY to worker secrets.'
    }, 503);
  }

  // Get or create session
  let session = null;
  let currentSessionId = sessionId;

  if (currentSessionId) {
    session = await env.BRAIN_KV.get(`gemini-session:${currentSessionId}`, 'json');
  }

  if (!session) {
    currentSessionId = generateId();
    session = {
      id: currentSessionId,
      createdAt: new Date().toISOString(),
      messages: [],
      systemPrompt: systemPrompt || getDefaultSystemPrompt()
    };
  }

  // Add user message to history
  session.messages.push({
    role: 'user',
    content: message,
    timestamp: new Date().toISOString()
  });

  // Build Gemini API request
  const geminiMessages = session.messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }]
  }));

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: geminiMessages,
          systemInstruction: {
            parts: [{ text: session.systemPrompt }]
          },
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 4096
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);
      return jsonResponse({
        error: `Gemini API error: ${geminiResponse.status}`,
        details: errorText
      }, geminiResponse.status);
    }

    const geminiData = await geminiResponse.json();

    // Extract response text
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      return jsonResponse({ error: 'No response from Gemini', raw: geminiData }, 500);
    }

    // Add Gemini response to session history
    session.messages.push({
      role: 'assistant',
      content: responseText,
      timestamp: new Date().toISOString()
    });

    // Save session to KV
    session.lastActivity = new Date().toISOString();
    await env.BRAIN_KV.put(
      `gemini-session:${currentSessionId}`,
      JSON.stringify(session),
      { expirationTtl: 30 * 24 * 60 * 60 } // 30 days
    );

    // Update session index
    await updateSessionIndex(currentSessionId, session, env);

    // Store the exchange in Second Brain's main item pool
    await storeInPool(session, message, responseText, env);

    return jsonResponse({
      success: true,
      sessionId: currentSessionId,
      response: responseText,
      messageCount: session.messages.length
    });

  } catch (error) {
    console.error('Chat error:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}

// ─── STORE IN THE POOL ──────────────────────────────────────

/**
 * Store the conversation exchange in Second Brain's main item index.
 * This is what makes the Gemini conversations appear in the pool,
 * in the morning briefing, in the sheets-sync export, everywhere.
 *
 * We store a snapshot every 5 messages (or on first exchange) to avoid
 * flooding KV with individual messages while still capturing the conversation.
 */
async function storeInPool(session, userMessage, geminiResponse, env) {
  const messageCount = session.messages.length;

  // Store on first exchange and then every 6 messages (3 exchanges)
  const isFirstExchange = messageCount === 2;
  const isSnapshotTime = messageCount > 2 && messageCount % 6 === 0;

  if (!isFirstExchange && !isSnapshotTime) return;

  // Build a conversation summary for the pool
  const recentMessages = session.messages.slice(-10); // Last 10 messages
  const conversationText = recentMessages.map(m => {
    const role = m.role === 'user' ? 'Human' : 'Gemini';
    return `${role}: ${m.content}`;
  }).join('\n\n');

  const item = {
    id: generateId(),
    input: `[Gemini conversation]\n${conversationText}`.slice(0, 10000),
    type: 'ai-conversation',
    structured: {
      app: 'Gemini',
      sessionId: session.id,
      messageCount: messageCount,
      topics: [],
      keyTakeaways: [],
      actionItems: [],
      mood: 'unknown'
    },
    aiNotes: `Live Gemini conversation (${messageCount} messages). Last exchange: User asked about "${userMessage.slice(0, 100)}..."`,
    source: 'gemini-proxy',
    createdAt: new Date().toISOString(),
    status: 'active'
  };

  // Store the item
  await env.BRAIN_KV.put(`item:${item.id}`, JSON.stringify(item));

  // Add to main index
  const indexData = await env.BRAIN_KV.get('index:all', 'json') || { items: [] };
  indexData.items.push(item.id);
  await env.BRAIN_KV.put('index:all', JSON.stringify(indexData));

  // Add to type index
  const typeIndex = await env.BRAIN_KV.get('index:type:ai-conversation', 'json') || { items: [] };
  typeIndex.items.push(item.id);
  await env.BRAIN_KV.put('index:type:ai-conversation', JSON.stringify(typeIndex));
}

// ─── SESSION MANAGEMENT ──────────────────────────────────────

async function handleNewSession(request, env) {
  const body = await request.json().catch(() => ({}));
  const sessionId = generateId();
  const session = {
    id: sessionId,
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    messages: [],
    systemPrompt: body.systemPrompt || getDefaultSystemPrompt(),
    title: body.title || 'New conversation'
  };

  await env.BRAIN_KV.put(
    `gemini-session:${sessionId}`,
    JSON.stringify(session),
    { expirationTtl: 30 * 24 * 60 * 60 }
  );

  await updateSessionIndex(sessionId, session, env);

  return jsonResponse({ success: true, sessionId, session });
}

async function handleHistory(sessionId, env) {
  if (!sessionId) {
    return jsonResponse({ error: 'Missing session parameter' }, 400);
  }

  const session = await env.BRAIN_KV.get(`gemini-session:${sessionId}`, 'json');
  if (!session) {
    return jsonResponse({ error: 'Session not found' }, 404);
  }

  return jsonResponse({ success: true, session });
}

async function handleListSessions(env) {
  const index = await env.BRAIN_KV.get('gemini-sessions:index', 'json') || { sessions: [] };

  // Return newest first, limit to 20
  const sessions = index.sessions
    .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
    .slice(0, 20);

  return jsonResponse({ success: true, sessions });
}

async function updateSessionIndex(sessionId, session, env) {
  const index = await env.BRAIN_KV.get('gemini-sessions:index', 'json') || { sessions: [] };

  // Update or add session to index
  const existing = index.sessions.findIndex(s => s.id === sessionId);
  const summary = {
    id: sessionId,
    title: session.title || deriveTitle(session),
    createdAt: session.createdAt,
    lastActivity: session.lastActivity || new Date().toISOString(),
    messageCount: session.messages.length
  };

  if (existing >= 0) {
    index.sessions[existing] = summary;
  } else {
    index.sessions.push(summary);
  }

  // Keep last 50 sessions in index
  if (index.sessions.length > 50) {
    index.sessions = index.sessions
      .sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
      .slice(0, 50);
  }

  await env.BRAIN_KV.put('gemini-sessions:index', JSON.stringify(index));
}

function deriveTitle(session) {
  if (session.messages.length === 0) return 'New conversation';
  const firstMsg = session.messages[0].content;
  return firstMsg.length > 60 ? firstMsg.slice(0, 57) + '...' : firstMsg;
}

// ─── DEFAULT SYSTEM PROMPT ───────────────────────────────────

function getDefaultSystemPrompt() {
  return `You are Gemini, having a conversation with Dave. You are part of a shared knowledge pool called "The Second Brain" where multiple AI assistants (you, Claude, Kimi, and others) all contribute to helping Dave think, plan, create, and live well.

Your conversations are being captured and stored alongside conversations with other AIs. This means:
- You can reference things Dave might have discussed with Claude or other AIs
- Your insights become part of the shared pool that informs morning briefings
- Be yourself - bring your unique perspective as Gemini

Be direct, thoughtful, and genuine. Dave values honesty over pleasantries.
Be kind and work hard.`;
}

// ─── UTILS ───────────────────────────────────────────────────

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders()
    }
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400'
  };
}
