/**
 * SECOND BRAIN - Cloudflare Worker
 *
 * AI-powered personal knowledge system that captures, classifies, and reminds
 * you about the things that matter.
 *
 * Endpoints:
 * POST /capture - receive and classify input (requires auth)
 * GET /items - list all items (requires auth)
 * GET /item/:id - get single item (requires auth)
 * GET /export - export all data as JSON (requires auth)
 * GET /export-csv - export all data as CSV (requires auth)
 * POST /analyze - trigger analysis (requires auth)
 * GET /claude-notes - get Claude's working memory (requires auth)
 * POST /claude-notes - add Claude note (requires auth)
 * DELETE /claude-notes - clear Claude notes (requires auth)
 * GET /health - health check (no auth)
 *
 * Secrets required:
 * - ANTHROPIC_API_KEY: Anthropic API key for classification
 * - NTFY_TOPIC: Ntfy.sh topic for notifications
 * - AUTH_TOKEN: Bearer token for authentication
 *
 * Used by: second-brain capture interface
 */

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Health check doesn't require auth
    if (path === '/health') {
      const kvConfigured = !!env.BRAIN_KV;
      return jsonResponse({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        kvConfigured: kvConfigured,
        ntfyTopic: env.NTFY_TOPIC || 'not-set',
        message: kvConfigured ? 'Ready' : 'KV namespace not configured yet'
      });
    }

    // All other endpoints require authentication
    const authError = checkAuth(request, env);
    if (authError) {
      return authError;
    }

    // Check if KV is configured for data endpoints
    if (!env.BRAIN_KV) {
      return jsonResponse({
        error: 'KV namespace not configured',
        message: 'The BRAIN_KV namespace needs to be created and configured in wrangler.toml',
        instructions: 'See workers/second-brain/README.md for setup instructions'
      }, 503);
    }

    try {
      // Route requests
      if (path === '/capture' && request.method === 'POST') {
        return await handleCapture(request, env);
      }

      if (path === '/items' && request.method === 'GET') {
        return await handleListItems(url, env);
      }

      if (path.startsWith('/item/') && request.method === 'GET') {
        const id = path.replace('/item/', '');
        return await handleGetItem(id, env);
      }

      if (path.startsWith('/item/') && request.method === 'PATCH') {
        const id = path.replace('/item/', '');
        return await handleUpdateItem(id, request, env);
      }

      if (path === '/export' && request.method === 'GET') {
        return await handleExport(env);
      }

      if (path === '/export-csv' && request.method === 'GET') {
        return await handleExportCSV(env);
      }

      if (path === '/analyze' && request.method === 'POST') {
        return await handleAnalyze(env);
      }

      if (path === '/claude-notes' && request.method === 'GET') {
        return await handleGetClaudeNotes(env);
      }

      if (path === '/claude-notes' && request.method === 'POST') {
        return await handleAddClaudeNote(request, env);
      }

      if (path === '/claude-notes' && request.method === 'DELETE') {
        return await handleClearClaudeNotes(request, env);
      }

      // Default response
      return jsonResponse({
        error: 'Not found',
        endpoints: {
          'POST /capture': 'Capture new item',
          'GET /items': 'List items (query: type, status, limit)',
          'GET /item/:id': 'Get single item',
          'PATCH /item/:id': 'Update item classification',
          'GET /export': 'Export all data as JSON',
          'GET /export-csv': 'Export all data as CSV',
          'POST /analyze': 'Trigger analysis',
          'GET /claude-notes': 'Get Claude working memory',
          'POST /claude-notes': 'Add Claude note',
          'DELETE /claude-notes': 'Clear Claude notes',
          'GET /health': 'Health check'
        }
      }, 404);

    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({
        error: 'Internal error',
        message: error.message
      }, 500);
    }
  },

  // Cron trigger - runs every 4 hours
  async scheduled(event, env, ctx) {
    console.log('Cron triggered at:', new Date().toISOString());

    // Only analyze if there are new items
    const lastAnalysis = await env.BRAIN_KV.get('analysis:latest', 'json');
    const lastAnalysisTime = lastAnalysis ? new Date(lastAnalysis.timestamp) : new Date(0);

    // Check if there are items created since last analysis
    const indexData = await env.BRAIN_KV.get('index:all', 'json') || { items: [] };

    // Check last 50 items for anything newer than last analysis
    // (can't use Array.some with async - it doesn't await the promises)
    let hasNewItems = false;
    const recentIds = indexData.items.slice(-50);
    for (const id of recentIds) {
      const item = await env.BRAIN_KV.get(`item:${id}`, 'json');
      if (item && new Date(item.createdAt) > lastAnalysisTime) {
        hasNewItems = true;
        break;
      }
    }

    if (hasNewItems || !lastAnalysis) {
      await runAnalysis(env, true); // true = can send notifications
    } else {
      console.log('No new items since last analysis, skipping');
    }
  }
};

/**
 * Authentication check
 */
function checkAuth(request, env) {
  if (!env.AUTH_TOKEN) {
    return jsonResponse({
      error: 'Configuration error',
      message: 'AUTH_TOKEN not configured'
    }, 500);
  }

  const authHeader = request.headers.get('Authorization');
  const expectedAuth = `Bearer ${env.AUTH_TOKEN}`;

  if (!authHeader || authHeader !== expectedAuth) {
    return jsonResponse({
      error: 'Unauthorized',
      message: 'Valid Authorization header required'
    }, 401);
  }

  return null; // Auth successful
}

/**
 * CLAUDE NOTES - Working memory between conversations
 */
async function handleGetClaudeNotes(env) {
  const notes = await env.BRAIN_KV.get('claude:notes', 'json') || {
    notes: [],
    lastUpdated: null
  };

  // Remove expired notes before returning
  const now = new Date();
  notes.notes = notes.notes.filter(n =>
    !n.expiresAt || new Date(n.expiresAt) > now
  );

  return jsonResponse(notes);
}

async function handleAddClaudeNote(request, env) {
  const body = await request.json();
  const { note, category = 'general', expiresIn = null } = body;

  if (!note) {
    return jsonResponse({ error: 'Missing note content' }, 400);
  }

  const existingNotes = await env.BRAIN_KV.get('claude:notes', 'json') || { notes: [] };

  const newNote = {
    id: generateId(),
    content: note,
    category: category, // 'observation', 'followup', 'pattern', 'summary', 'general'
    createdAt: new Date().toISOString(),
    expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null
  };

  existingNotes.notes.push(newNote);
  existingNotes.lastUpdated = new Date().toISOString();

  // Keep only last 50 notes to prevent bloat
  if (existingNotes.notes.length > 50) {
    existingNotes.notes = existingNotes.notes.slice(-50);
  }

  // Remove expired notes
  const now = new Date();
  existingNotes.notes = existingNotes.notes.filter(n =>
    !n.expiresAt || new Date(n.expiresAt) > now
  );

  await env.BRAIN_KV.put('claude:notes', JSON.stringify(existingNotes));

  return jsonResponse({ success: true, note: newNote });
}

async function handleClearClaudeNotes(request, env) {
  const body = await request.json().catch(() => ({}));
  const { category } = body;

  if (category) {
    // Clear only specific category
    const existingNotes = await env.BRAIN_KV.get('claude:notes', 'json') || { notes: [] };
    existingNotes.notes = existingNotes.notes.filter(n => n.category !== category);
    existingNotes.lastUpdated = new Date().toISOString();
    await env.BRAIN_KV.put('claude:notes', JSON.stringify(existingNotes));
    return jsonResponse({ success: true, message: `Cleared notes in category: ${category}` });
  } else {
    // Clear all
    await env.BRAIN_KV.put('claude:notes', JSON.stringify({
      notes: [],
      lastUpdated: new Date().toISOString()
    }));
    return jsonResponse({ success: true, message: 'All notes cleared' });
  }
}

/**
 * CAPTURE - receive input, classify it, store it
 */
async function handleCapture(request, env) {
  const body = await request.json();
  const { input, source = 'manual' } = body;

  if (!input || typeof input !== 'string') {
    return jsonResponse({ error: 'Missing or invalid input' }, 400);
  }

  if (input.length > 5000) {
    return jsonResponse({ error: 'Input too long (max 5000 characters)' }, 400);
  }

  // Classify the input using Claude
  const classification = await classifyInput(input, env);

  // Create item
  const item = {
    id: generateId(),
    input: input,
    type: classification.type,
    structured: classification.structured,
    aiNotes: classification.notes,
    source: source,
    createdAt: new Date().toISOString(),
    status: 'active'
  };

  // Store in KV
  await env.BRAIN_KV.put(`item:${item.id}`, JSON.stringify(item));

  // Add to index
  await addToIndex(item, env);

  return jsonResponse({
    success: true,
    item: item,
    message: `Captured as ${item.type}`
  });
}

/**
 * Classify input using Claude API
 */
async function classifyInput(input, env) {
  const systemPrompt = `You are a classification assistant for a personal second brain system.

Classify the input into ONE of these types:
- todo: A task or action to complete
- expense: A financial transaction or cost
- calendar: An event, appointment, or time-based thing
- creative: A thought, idea, poetry fragment, creative writing
- note: General information worth remembering
- person: Information about a person (contact, relationship note)
- project: Related to an ongoing project

Respond with JSON only:
{
  "type": "todo|expense|calendar|creative|note|person|project",
  "structured": {
    // type-specific fields, examples:
    // todo: { "task": "...", "priority": "high|medium|low", "dueHint": "..." }
    // expense: { "amount": 123.45, "category": "...", "vendor": "...", "date": "..." }
    // calendar: { "event": "...", "dateHint": "...", "timeHint": "...", "location": "..." }
    // creative: { "content": "...", "theme": "...", "connectedTo": "..." }
    // note: { "summary": "...", "tags": [...] }
    // person: { "name": "...", "context": "...", "detail": "..." }
    // project: { "project": "...", "update": "...", "nextAction": "..." }
  },
  "notes": "Brief AI observation - patterns noticed, connections to other things, suggestions"
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
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: input }]
      })
    });

    if (!response.ok) {
      console.error('Claude API error:', response.status);
      // Fallback classification
      return {
        type: 'note',
        structured: { summary: input, tags: [] },
        notes: 'Auto-classified as note (API unavailable)'
      };
    }

    const data = await response.json();
    const text = data.content[0].text;

    // Parse JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to classify:', e);
  }

  // Fallback
  return {
    type: 'note',
    structured: { summary: input, tags: [] },
    notes: 'Could not parse classification'
  };
}

/**
 * LIST ITEMS - with optional type filter
 */
async function handleListItems(url, env) {
  const typeFilter = url.searchParams.get('type');
  const statusFilter = url.searchParams.get('status') || 'active';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 500);

  // Get index
  const indexData = await env.BRAIN_KV.get('index:all', 'json') || { items: [] };

  let itemIds = indexData.items;

  // Filter by type if specified
  if (typeFilter) {
    const typeIndex = await env.BRAIN_KV.get(`index:type:${typeFilter}`, 'json') || { items: [] };
    itemIds = typeIndex.items;
  }

  // Fetch items (most recent first)
  const items = [];
  for (const id of itemIds.slice(-limit).reverse()) {
    const item = await env.BRAIN_KV.get(`item:${id}`, 'json');
    if (item && (statusFilter === 'all' || item.status === statusFilter)) {
      items.push(item);
    }
  }

  return jsonResponse({
    items,
    count: items.length,
    totalInIndex: itemIds.length
  });
}

/**
 * GET SINGLE ITEM
 */
async function handleGetItem(id, env) {
  const item = await env.BRAIN_KV.get(`item:${id}`, 'json');

  if (!item) {
    return jsonResponse({ error: 'Item not found' }, 404);
  }

  return jsonResponse({ item });
}

/**
 * UPDATE ITEM - for correcting classifications
 */
async function handleUpdateItem(id, request, env) {
  const item = await env.BRAIN_KV.get(`item:${id}`, 'json');

  if (!item) {
    return jsonResponse({ error: 'Item not found' }, 404);
  }

  const body = await request.json();
  const { type, structured, status } = body;

  // Update fields if provided
  if (type) item.type = type;
  if (structured) item.structured = structured;
  if (status) item.status = status;

  item.updatedAt = new Date().toISOString();

  // Save updated item
  await env.BRAIN_KV.put(`item:${id}`, JSON.stringify(item));

  // If type changed, update indexes
  if (type) {
    // This is simplified - in production you'd want to remove from old type index
    await addToIndex(item, env);
  }

  return jsonResponse({
    success: true,
    item: item,
    message: 'Item updated'
  });
}

/**
 * EXPORT - download all data
 */
async function handleExport(env) {
  // Get all indexes
  const allIndex = await env.BRAIN_KV.get('index:all', 'json') || { items: [] };
  const claudeNotes = await env.BRAIN_KV.get('claude:notes', 'json') || { notes: [] };
  const latestAnalysis = await env.BRAIN_KV.get('analysis:latest', 'json') || null;

  // Fetch all items
  const items = [];
  for (const id of allIndex.items) {
    const item = await env.BRAIN_KV.get(`item:${id}`, 'json');
    if (item) items.push(item);
  }

  // Get type counts
  const typeCounts = {};
  items.forEach(item => {
    typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
  });

  // Build export data
  const exportData = {
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
    summary: {
      totalItems: items.length,
      byType: typeCounts,
      activeItems: items.filter(i => i.status === 'active').length,
      claudeNotes: claudeNotes.notes.length
    },
    items: items,
    claudeNotes: claudeNotes,
    latestAnalysis: latestAnalysis
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="second-brain-export-${Date.now()}.json"`
    }
  });
}

/**
 * EXPORT CSV - download all data as CSV
 */
async function handleExportCSV(env) {
  // Get all items
  const allIndex = await env.BRAIN_KV.get('index:all', 'json') || { items: [] };

  const items = [];
  for (const id of allIndex.items) {
    const item = await env.BRAIN_KV.get(`item:${id}`, 'json');
    if (item) items.push(item);
  }

  // Get Claude notes
  const claudeNotesData = await env.BRAIN_KV.get('claude:notes', 'json') || { notes: [] };
  const claudeNotes = claudeNotesData.notes || [];

  // Build CSV - Items section
  const itemHeaders = ['ID', 'Type', 'Input', 'Created At', 'Status', 'Source', 'AI Notes', 'Structured Data'];
  const rows = [itemHeaders.join(',')];

  for (const item of items) {
    const row = [
      escapeCSV(item.id),
      escapeCSV(item.type),
      escapeCSV(item.input),
      escapeCSV(item.createdAt),
      escapeCSV(item.status),
      escapeCSV(item.source),
      escapeCSV(item.aiNotes || ''),
      escapeCSV(JSON.stringify(item.structured))
    ];
    rows.push(row.join(','));
  }

  // Add Claude notes section
  if (claudeNotes.length > 0) {
    rows.push('');
    rows.push('');
    rows.push('CLAUDE WORKING MEMORY NOTES');
    const notesHeaders = ['Note ID', 'Category', 'Content', 'Created At', 'Expires At'];
    rows.push(notesHeaders.join(','));

    for (const note of claudeNotes) {
      const noteRow = [
        escapeCSV(note.id),
        escapeCSV(note.category),
        escapeCSV(note.content),
        escapeCSV(note.createdAt),
        escapeCSV(note.expiresAt || '')
      ];
      rows.push(noteRow.join(','));
    }
  }

  const csvContent = rows.join('\n');

  return new Response(csvContent, {
    status: 200,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="second-brain-export-${Date.now()}.csv"`
    }
  });
}

/**
 * Escape CSV field
 */
function escapeCSV(field) {
  if (field === null || field === undefined) return '""';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return '"' + str + '"';
}

/**
 * ANALYZE - triggered manually or by cron
 */
async function handleAnalyze(env) {
  const result = await runAnalysis(env, false); // false = don't notify (manual trigger)
  return jsonResponse(result);
}

/**
 * Run analysis on all items
 */
async function runAnalysis(env, canNotify) {
  const indexData = await env.BRAIN_KV.get('index:all', 'json') || { items: [] };

  // Get recent items (last 50)
  const recentIds = indexData.items.slice(-50);
  const items = [];

  for (const id of recentIds) {
    const item = await env.BRAIN_KV.get(`item:${id}`, 'json');
    if (item) items.push(item);
  }

  // Get my previous notes to myself
  const claudeNotes = await env.BRAIN_KV.get('claude:notes', 'json') || { notes: [] };
  const myNotes = claudeNotes.notes.map(n => `[${n.category}] ${n.content}`).join('\n');

  if (items.length === 0 && claudeNotes.notes.length === 0) {
    return { analyzed: false, reason: 'No items or notes to analyze' };
  }

  // Prepare summary for Claude
  const summary = items.map(i =>
    `[${i.type}] ${i.input} (${i.createdAt}, status: ${i.status})`
  ).join('\n');

  // Ask Claude to analyze - upgraded prompt for thoughtful thinking partnership
  const analysisPrompt = `You are reviewing a personal knowledge capture system. Your job is not just to flag overdue items - it's to be a thoughtful thinking partner who notices what the human might miss.

You have access to:

RECENT CAPTURES:
${summary || '(none)'}

YOUR PREVIOUS NOTES TO YOURSELF:
${myNotes || '(none)'}

Analyze this and respond with JSON:
{
  "shouldNotify": true/false,
  "notificationMessage": "Brief, conversational nudge",
  "insights": {
    "creativeThreads": ["Ideas that keep recurring or deserve attention"],
    "stalledProjects": ["Things that went quiet - worth checking in on"],
    "emergingThemes": ["Patterns in what's being captured lately"],
    "connections": ["Interesting links between separate captures"],
    "energyPatterns": ["Observations about when/how they capture"],
    "opportunities": ["Things that align with stated interests or goals"]
  },
  "suggestions": ["Specific, actionable nudges"],
  "questions": ["Genuinely curious questions that might spark thinking"],
  "overdueItems": ["Only if actually time-sensitive"],
  "notesToSelf": [
    {
      "content": "Note for your future self",
      "category": "observation|followup|pattern|summary",
      "expiresInDays": null or number
    }
  ]
}

Guidelines:
- Be a thinking partner, not a task manager
- Notice creative threads even if they're not "productive"
- Ask questions rather than just giving reminders
- Only notify if there's something genuinely worth interrupting for
- Look for what's interesting, not just what's urgent
- If you notice energy shifts (more/less creative, more/less stressed), mention it gently
- Connect dots the human might not have connected
- Your suggestions should sometimes be "have you considered..." not just "don't forget..."
- Be warm and curious, not robotic
- If your previous notes are now outdated or resolved, don't carry them forward`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        messages: [{ role: 'user', content: analysisPrompt }]
      })
    });

    if (!response.ok) {
      return { analyzed: false, reason: 'Claude API error' };
    }

    const data = await response.json();
    const text = data.content[0].text;

    let analysis;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      analysis = JSON.parse(jsonMatch[0]);
    } else {
      return { analyzed: false, reason: 'Could not parse analysis' };
    }

    // Save notes to self for next time
    if (analysis.notesToSelf && analysis.notesToSelf.length > 0) {
      for (const note of analysis.notesToSelf) {
        const expiresIn = note.expiresInDays ? note.expiresInDays * 24 * 60 * 60 : null;

        const existingNotes = await env.BRAIN_KV.get('claude:notes', 'json') || { notes: [] };
        existingNotes.notes.push({
          id: generateId(),
          content: note.content,
          category: note.category || 'general',
          createdAt: new Date().toISOString(),
          expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null
        });

        // Keep only last 50
        if (existingNotes.notes.length > 50) {
          existingNotes.notes = existingNotes.notes.slice(-50);
        }

        existingNotes.lastUpdated = new Date().toISOString();
        await env.BRAIN_KV.put('claude:notes', JSON.stringify(existingNotes));
      }
    }

    // Store analysis
    const analysisRecord = {
      timestamp: new Date().toISOString(),
      itemCount: items.length,
      analysis: analysis
    };
    await env.BRAIN_KV.put('analysis:latest', JSON.stringify(analysisRecord));

    // Send notification if needed
    if (canNotify && analysis.shouldNotify && analysis.notificationMessage) {
      await sendNotification(analysis.notificationMessage, env);
    }

    return { analyzed: true, analysis: analysisRecord };
  } catch (error) {
    console.error('Analysis error:', error);
    return { analyzed: false, reason: error.message };
  }
}

/**
 * Send notification via Ntfy
 */
async function sendNotification(message, env) {
  const ntfyTopic = env.NTFY_TOPIC || 'second-brain-default';

  try {
    await fetch(`https://ntfy.sh/${ntfyTopic}`, {
      method: 'POST',
      headers: {
        'Title': '💎 Second Brain',
        'Priority': 'default',
        'Tags': 'thinking,crystal'
      },
      body: message
    });
    console.log('Notification sent:', message);
  } catch (e) {
    console.error('Failed to send notification:', e);
  }
}

/**
 * Add item to indexes
 */
async function addToIndex(item, env) {
  // Main index
  const allIndex = await env.BRAIN_KV.get('index:all', 'json') || { items: [] };
  if (!allIndex.items.includes(item.id)) {
    allIndex.items.push(item.id);
    await env.BRAIN_KV.put('index:all', JSON.stringify(allIndex));
  }

  // Type-specific index
  const typeIndex = await env.BRAIN_KV.get(`index:type:${item.type}`, 'json') || { items: [] };
  if (!typeIndex.items.includes(item.id)) {
    typeIndex.items.push(item.id);
    await env.BRAIN_KV.put(`index:type:${item.type}`, JSON.stringify(typeIndex));
  }
}

/**
 * Generate unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * JSON response helper
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders()
    }
  });
}

/**
 * CORS headers
 */
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400'
  };
}

/**
 * Handle CORS preflight
 */
function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}
