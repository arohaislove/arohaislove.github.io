/**
 * SECOND BRAIN - Cloudflare Worker
 * Redeployed: 2026-01-18
 *
 * AI-powered personal knowledge system that captures, classifies, and reminds
 * you about the things that matter.
 *
 * Endpoints:
 * POST /capture - receive and classify input (requires auth)
 * POST /comms - capture communication data from Tasker (requires auth)
 * GET /items - list all items (requires auth)
 * GET /item/:id - get single item (requires auth)
 * GET /export - export all data as JSON (requires auth)
 * GET /export-csv - export all data as CSV (requires auth)
 * POST /analyze - trigger analysis (requires auth)
 * POST /briefing - generate morning briefing (requires auth)
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

/**
 * TIMEZONE CONFIGURATION
 * All time-based operations use this timezone for determining "today", grouping by date, etc.
 */
const CONFIG = {
  timezone: 'Pacific/Auckland',
  morningBriefingHour: 4 // 4am in the configured timezone
};

/**
 * TIMEZONE HELPER FUNCTIONS
 * Convert UTC timestamps to user's timezone for date calculations
 */

/**
 * Get the current date in the configured timezone (YYYY-MM-DD format)
 */
function getTodayInTimezone() {
  const now = new Date();
  return new Intl.DateTimeFormat('en-NZ', {
    timeZone: CONFIG.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now).split('/').reverse().join('-');
}

/**
 * Get date from ISO timestamp in the configured timezone (YYYY-MM-DD format)
 */
function getDateInTimezone(isoTimestamp) {
  const date = new Date(isoTimestamp);
  return new Intl.DateTimeFormat('en-NZ', {
    timeZone: CONFIG.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date).split('/').reverse().join('-');
}

/**
 * Get current hour in the configured timezone (0-23)
 */
function getCurrentHourInTimezone() {
  const now = new Date();
  const timeStr = new Intl.DateTimeFormat('en-NZ', {
    timeZone: CONFIG.timezone,
    hour: '2-digit',
    hour12: false
  }).format(now);
  return parseInt(timeStr, 10);
}

/**
 * Format a date for display in the configured timezone
 */
function formatDateInTimezone(isoTimestamp, format = 'short') {
  const date = new Date(isoTimestamp);

  if (format === 'short') {
    // YYYY-MM-DD
    return getDateInTimezone(isoTimestamp);
  } else if (format === 'long') {
    // "Day, Month Date, Year" (e.g., "Friday, January 24, 2026")
    return new Intl.DateTimeFormat('en-NZ', {
      timeZone: CONFIG.timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } else if (format === 'time') {
    // HH:MM
    return new Intl.DateTimeFormat('en-NZ', {
      timeZone: CONFIG.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
  }

  return getDateInTimezone(isoTimestamp);
}

/**
 * Check if a timestamp is "today" in the configured timezone
 */
function isToday(isoTimestamp) {
  const today = getTodayInTimezone();
  const itemDate = getDateInTimezone(isoTimestamp);
  return itemDate === today;
}

/**
 * Check if a timestamp is "yesterday" in the configured timezone
 */
function isYesterday(isoTimestamp) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = new Intl.DateTimeFormat('en-NZ', {
    timeZone: CONFIG.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(yesterday).split('/').reverse().join('-');

  const itemDate = getDateInTimezone(isoTimestamp);
  return itemDate === yesterdayStr;
}

/**
 * Get items from the last N hours in the user's timezone
 */
function getItemsFromLastNHours(items, hours) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - (hours * 60 * 60 * 1000));

  return items.filter(item => {
    const itemTime = new Date(item.createdAt);
    return itemTime >= cutoff;
  });
}

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

      if (path === '/comms' && request.method === 'POST') {
        return await handleComms(request, env);
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

      if (path === '/briefing' && request.method === 'POST') {
        return await handleBriefing(env);
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

      if (path === '/signals' && request.method === 'GET') {
        return await handleGetSignals(url, env);
      }

      if (path.startsWith('/signal/') && path.endsWith('/feedback') && request.method === 'POST') {
        const id = path.replace('/signal/', '').replace('/feedback', '');
        return await handleSignalFeedback(id, request, env);
      }

      if (path === '/signal-exclusions' && request.method === 'GET') {
        return await handleGetExclusions(env);
      }

      if (path === '/signal-exclusions' && request.method === 'POST') {
        return await handleAddExclusion(request, env);
      }

      // Default response
      return jsonResponse({
        error: 'Not found',
        endpoints: {
          'POST /capture': 'Capture new item',
          'POST /comms': 'Capture communication data (Tasker)',
          'GET /items': 'List items (query: type, status, limit)',
          'GET /item/:id': 'Get single item',
          'PATCH /item/:id': 'Update item classification',
          'GET /export': 'Export all data as JSON',
          'GET /export-csv': 'Export all data as CSV',
          'POST /analyze': 'Trigger analysis',
          'POST /briefing': 'Generate morning briefing',
          'GET /claude-notes': 'Get Claude working memory',
          'POST /claude-notes': 'Add Claude note',
          'DELETE /claude-notes': 'Clear Claude notes',
          'GET /signals': 'Get signal readings queue',
          'POST /signal/:id/feedback': 'Add feedback to signal analysis',
          'GET /signal-exclusions': 'Get excluded contacts/apps',
          'POST /signal-exclusions': 'Add exclusion',
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

  // Cron trigger - runs every 4 hours + morning briefing at configured hour in user's timezone
  async scheduled(event, env, ctx) {
    console.log('Cron triggered at:', new Date().toISOString());

    // Check if this is the morning briefing time using timezone-aware logic
    const currentHour = getCurrentHourInTimezone();
    const isMorningBriefing = currentHour === CONFIG.morningBriefingHour;

    if (isMorningBriefing) {
      // Generate and send full morning briefing
      try {
        const briefing = await generateMorningBriefing(env);

        // Save full briefing to KV storage for dashboard
        const briefingRecord = {
          timestamp: new Date().toISOString(),
          date: getTodayInTimezone(), // Use timezone-aware date
          briefing: briefing
        };
        await env.BRAIN_KV.put('briefing:latest', JSON.stringify(briefingRecord));

        // Also save with date key for history
        const dateKey = `briefing:${briefingRecord.date}`;
        await env.BRAIN_KV.put(dateKey, JSON.stringify(briefingRecord));

        await sendMorningBriefing(briefing, env);
        console.log('Morning briefing generated, saved, and sent');
      } catch (error) {
        console.error('Failed to generate morning briefing:', error);
        // Fallback to simple ping if briefing generation fails
        await sendMorningBriefingPing(env);
      }
      return; // Don't run regular analysis for morning briefing
    }

    // Regular analysis for other cron runs
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
  const { input, source = 'manual', image = null } = body;

  if (!input || typeof input !== 'string') {
    return jsonResponse({ error: 'Missing or invalid input' }, 400);
  }

  if (input.length > 5000) {
    return jsonResponse({ error: 'Input too long (max 5000 characters)' }, 400);
  }

  // Classify the input using Claude (with vision if image provided)
  const classification = await classifyInput(input, env, image);

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

  // Add image if provided
  if (image) {
    item.image = image;
  }

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
 * COMMS CAPTURE - receive communication data from Tasker
 */
async function handleComms(request, env) {
  const body = await request.json();
  const {
    message,
    direction = 'incoming',
    app = 'unknown',
    contact = 'unknown',
    timestamp = null
  } = body;

  if (!message || typeof message !== 'string') {
    return jsonResponse({ error: 'Missing or invalid message' }, 400);
  }

  if (message.length > 5000) {
    return jsonResponse({ error: 'Message too long (max 5000 characters)' }, 400);
  }

  // Deduplication: check if same message from same contact in last 5 minutes
  const indexData = await env.BRAIN_KV.get('index:all', 'json') || { items: [] };
  const recentIds = indexData.items.slice(-20); // Check last 20 items
  const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

  for (const id of recentIds) {
    const existingItem = await env.BRAIN_KV.get(`item:${id}`, 'json');
    if (!existingItem || existingItem.type !== 'comms') continue;

    const itemTime = new Date(existingItem.createdAt).getTime();
    if (itemTime < fiveMinutesAgo) continue;

    // Check if duplicate (same message, contact, and direction)
    if (existingItem.input === message &&
        existingItem.structured?.contact === contact &&
        existingItem.structured?.direction === direction) {
      return jsonResponse({
        success: true,
        item: existingItem,
        message: 'Duplicate message ignored',
        duplicate: true
      });
    }
  }

  // Check if this should be flagged for signal analysis
  const shouldFlag = await shouldFlagForSignalAnalysis(message, direction, app, contact, env);

  // Create comms item without classification (raw capture)
  const item = {
    id: generateId(),
    input: message,
    type: 'comms',
    structured: {
      direction: direction,
      app: app,
      contact: contact
    },
    aiNotes: null, // No AI analysis yet - will be analyzed in briefing
    source: 'tasker',
    createdAt: timestamp || new Date().toISOString(),
    status: 'active',
    needsSignalAnalysis: shouldFlag
  };

  // Store in KV
  await env.BRAIN_KV.put(`item:${item.id}`, JSON.stringify(item));

  // Add to index
  await addToIndex(item, env);

  // Add to contact history
  await addToContactHistory(contact, item.id, env);

  // If flagged, queue for signal analysis
  if (shouldFlag) {
    await queueSignalAnalysis(item, env);
  }

  return jsonResponse({
    success: true,
    item: item,
    message: `Captured ${direction} ${app} message${shouldFlag ? ' [flagged for signal analysis]' : ''}`
  });
}

/**
 * Classify input using Claude API
 */
async function classifyInput(input, env, image = null) {
  const systemPrompt = `You are a classification assistant for a personal second brain system.

Classify the input into ONE of these types:
- todo: A task or action to complete
- expense: A financial transaction or cost (especially from receipts!)
- calendar: An event, appointment, or time-based thing
- creative: A thought, idea, poetry fragment, creative writing, or visual inspiration
- note: General information worth remembering
- person: Information about a person (contact, relationship note)
- project: Related to an ongoing project

${image ? 'The user has provided an IMAGE along with optional text. Analyze the image carefully and classify based on what you see. Extract any text from receipts, notes, or documents. Describe visual content for creative captures.' : ''}

Respond with JSON only:
{
  "type": "todo|expense|calendar|creative|note|person|project",
  "structured": {
    // type-specific fields, examples:
    // todo: { "task": "...", "priority": "high|medium|low", "dueHint": "..." }
    // expense: { "amount": 123.45, "category": "...", "vendor": "...", "date": "..." }
    // calendar: { "event": "...", "dateHint": "...", "timeHint": "...", "location": "..." }
    // creative: { "content": "...", "theme": "...", "connectedTo": "...", "visualDescription": "..." }
    // note: { "summary": "...", "tags": [...] }
    // person: { "name": "...", "context": "...", "detail": "..." }
    // project: { "project": "...", "update": "...", "nextAction": "..." }
  },
  "notes": "Brief AI observation - what you saw in the image, patterns noticed, connections, suggestions"
}`;

  try {
    // Build message content
    let messageContent;

    if (image) {
      // Extract media type and base64 data from data URL
      const matches = image.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        throw new Error('Invalid image data format');
      }

      const mediaType = matches[1];
      const base64Data = matches[2];

      // Vision request with image + text
      messageContent = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: base64Data
          }
        },
        {
          type: 'text',
          text: input
        }
      ];
    } else {
      // Text-only request
      messageContent = input;
    }

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
        messages: [{ role: 'user', content: messageContent }]
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
  const latestBriefing = await env.BRAIN_KV.get('briefing:latest', 'json') || null;

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
    latestAnalysis: latestAnalysis,
    latestBriefing: latestBriefing
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
 * Handle morning briefing request
 */
async function handleBriefing(env) {
  try {
    const briefing = await generateMorningBriefing(env);
    return jsonResponse({
      success: true,
      briefing: briefing,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    return jsonResponse({
      success: false,
      error: error.message
    }, 500);
  }
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
 * Send morning briefing ping via Ntfy (fallback if briefing generation fails)
 */
async function sendMorningBriefingPing(env) {
  const ntfyTopic = env.NTFY_TOPIC || 'second-brain-default';

  try {
    await fetch(`https://ntfy.sh/${ntfyTopic}`, {
      method: 'POST',
      headers: {
        'Title': '☀️ Morning Briefing',
        'Priority': 'high',
        'Tags': 'alarm,sunrise,coffee',
        'Actions': 'view, Dashboard, https://arohaislove.github.io/second-brain/dashboard.html; view, Claude Chat, https://claude.ai; view, Claude Code, https://claude.ai/code'
      },
      body: 'Dave. Briefing time.\n\n1. Tap "Dashboard" to review your recent Second Brain entries\n2. Choose "Claude Chat" for life coach conversation, or "Claude Code" for task-oriented work\n3. Share your dashboard context and we\'ll talk'
    });
    console.log('Morning briefing ping sent');
  } catch (e) {
    console.error('Failed to send morning briefing ping:', e);
  }
}

/**
 * Generate morning briefing using Claude API
 */
async function generateMorningBriefing(env) {
  // Get recent items (last 50 to ensure we get enough comms)
  const indexData = await env.BRAIN_KV.get('index:all', 'json') || { items: [] };
  const recentIds = indexData.items.slice(-50);
  const items = [];

  for (const id of recentIds) {
    const item = await env.BRAIN_KV.get(`item:${id}`, 'json');
    if (item) items.push(item);
  }

  // Get Claude's working memory
  const claudeNotes = await env.BRAIN_KV.get('claude:notes', 'json') || { notes: [] };

  // Separate comms from other captures
  const commsItems = items.filter(i => i.type === 'comms');
  const otherItems = items.filter(i => i.type !== 'comms');

  // Format regular captures for briefing (using timezone-aware dates)
  const recentCaptures = otherItems.map(i =>
    `[${i.type.toUpperCase()}] ${getDateInTimezone(i.createdAt)}\nInput: ${i.input}\nAI Notes: ${i.aiNotes || 'none'}`
  ).join('\n\n');

  // Format comms data for analysis (using timezone-aware dates)
  const commsData = commsItems.map(i => {
    const structured = i.structured || {};
    return `[${structured.direction?.toUpperCase() || 'UNKNOWN'}] ${structured.app || 'unknown'} - ${structured.contact || 'unknown'}\n${getDateInTimezone(i.createdAt)} ${formatDateInTimezone(i.createdAt, 'time')}\nMessage: ${i.input}`;
  }).join('\n\n');

  // Format Claude's working memory
  const workingMemory = claudeNotes.notes
    .filter(n => !n.expiresAt || new Date(n.expiresAt) > new Date())
    .map(n => `[${n.category}] ${n.content}`)
    .join('\n');

  // Get top 3 signal readings (unreviewed, highest priority)
  const signalQueue = await env.BRAIN_KV.get('signal-queue:all', 'json') || { items: [] };
  const topSignals = signalQueue.items.filter(s => !s.reviewed).slice(0, 3);

  const signalReadings = [];
  for (const queueItem of topSignals) {
    const analysis = await env.BRAIN_KV.get(`signal:${queueItem.itemId}`, 'json');
    const item = await env.BRAIN_KV.get(`item:${queueItem.itemId}`, 'json');

    if (analysis && item) {
      signalReadings.push({
        contact: queueItem.contact,
        date: getDateInTimezone(item.createdAt), // Use timezone-aware date
        message: item.input,
        direction: item.structured?.direction,
        app: item.structured?.app,
        analysis: analysis
      });
    }
  }

  const signalData = signalReadings.map(s =>
    `[${s.contact}] ${s.date} (${s.direction} via ${s.app})
Message: ${s.message}
Key dynamic: ${s.analysis.keyDynamic}
Possible subtext: ${s.analysis.possibleSubtext}
What worked: ${s.analysis.whatWorked || 'n/a'}
Pattern note: ${s.analysis.patternNote || 'n/a'}
Action: ${s.analysis.action}`
  ).join('\n\n---\n\n');

  const briefingPrompt = `You are Dave's AI life coach, delivering his daily 4am morning briefing. This is a conversational, thoughtful analysis of his Second Brain captures, communication patterns, and life rhythms.

TODAY'S DATE: ${getTodayInTimezone()} (${CONFIG.timezone})

RECENT CAPTURES (manual voice/text entries):
${recentCaptures || '(no recent captures)'}

COMMUNICATIONS DATA (from Tasker - last 48 hours):
${commsData || '(no comms data yet)'}

SIGNAL READINGS (analyzed interactions - what you might have missed):
${signalData || '(no signal readings yet)'}

YOUR WORKING MEMORY (patterns you've noticed):
${workingMemory || '(no working memory yet)'}

Generate a morning briefing in this exact structure:

# ☀️ MORNING BRIEFING - ${formatDateInTimezone(new Date().toISOString(), 'long')}

Dave. Morning.

## One Provocation
[A gentle challenge or observation that might spark reflection. Start with this - it's the most important thing.]

## What Needs Attention Today

### 🔴 **Health**
[If relevant - call out any health mentions, weight tracking, discomfort]

### 🟡 **Open Tasks**
[Specific items that need doing]

### 🟢 **Energy Opportunities**
[Things that might energize them - where their attention is naturally going]

## One Thing for Today
**Practical**: [One clear, small action they can take]

## One Thing to Sit With
**Reflective**: [One question or thought to carry through the day]

## From My World (What I'm Bringing)
[1-3 external insights: relevant news, tech developments, tools, or connections to their interests. Be specific and useful. This is YOUR wisdom, not theirs.]

## Signal Reading: What You Might Have Missed 📡
[IF signal readings are available, include up to 3 analyzed interactions. For each:
- **[Contact name]** - [Date]
- Key dynamic: [one sentence]
- Possible subtext: [one sentence]
- What worked: [one sentence or "nothing notable"]
- Pattern note: [if connects to recurring theme]

If no signal readings, say "No flagged interactions this period."]

## What Claude (in your Second Brain) Has Been Noticing
[Pull key insights from your working memory - patterns you've spotted across their captures]

## The Big Context
[Life events, transitions, what's happening this week - the broader picture]

## What I'm Seeing (Last 48 Hours)
[Summarize what they've captured, group by themes. Be specific with counts and dates.]

### **[Pattern 1 Name]**
- Bullet point observations
- What stands out

### **[Pattern 2 Name]**
- More observations

### **Communication Patterns** 📱
[If comms data available:
- Who's reaching out, who you're avoiding
- Response timing patterns (immediate vs delayed)
- Energy in different conversations
- Who you haven't heard from in a while
- Conversations that might need attention
Be specific with names and patterns. Don't invade privacy - focus on patterns that matter.]

### **Open Loops**
[Tasks or threads that are unfinished]

---

CRITICAL: Put the WISDOM at the TOP (provocation, what needs attention, one thing for today, one thing to sit with, external insights). Put the DATA at the BOTTOM (what I'm seeing, communication patterns). If the briefing gets truncated, we want to keep the wisdom, not the data recap.

TONE:
- Direct but warm
- Pattern-spotter, not task-manager
- Notice what energizes them, not just what's broken
- Ask questions, don't just remind
- Be honest, even if uncomfortable
- Connect dots they might miss

Keep it concise but insightful. This should feel like talking to a smart friend who's been paying attention.`;

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
        max_tokens: 4096,
        messages: [{ role: 'user', content: briefingPrompt }]
      })
    });

    if (!response.ok) {
      throw new Error('Claude API error');
    }

    const data = await response.json();
    const briefing = data.content[0].text;

    return briefing;
  } catch (error) {
    console.error('Failed to generate briefing:', error);
    throw error;
  }
}

/**
 * Send full morning briefing via Ntfy
 */
async function sendMorningBriefing(briefing, env) {
  const ntfyTopic = env.NTFY_TOPIC || 'second-brain-default';

  // Truncate if too long for ntfy (max 4096 bytes)
  const maxLength = 4000;
  let body = briefing;
  if (briefing.length > maxLength) {
    body = briefing.substring(0, maxLength) + '\n\n...[Briefing truncated - open Dashboard for full view]';
  }

  try {
    await fetch(`https://ntfy.sh/${ntfyTopic}`, {
      method: 'POST',
      headers: {
        'Title': '☀️ Morning Briefing',
        'Priority': 'high',
        'Tags': 'alarm,sunrise,coffee',
        'Actions': 'view, Dashboard, https://arohaislove.github.io/second-brain/dashboard.html; view, Claude Chat, https://claude.ai; view, Claude Code, https://claude.ai/code'
      },
      body: body
    });
    console.log('Morning briefing sent via ntfy');
  } catch (e) {
    console.error('Failed to send morning briefing:', e);
    throw e;
  }
}

/**
 * SIGNAL READING MODULE
 * Analyzes captured interactions for subtext and dynamics
 */

/**
 * Determine if an interaction should be flagged for signal analysis
 */
async function shouldFlagForSignalAnalysis(message, direction, app, contact, env) {
  // Check exclusions first
  const exclusions = await env.BRAIN_KV.get('signal-exclusions', 'json') || { contacts: [], apps: [] };

  if (exclusions.contacts.includes(contact.toLowerCase())) return false;
  if (exclusions.apps.includes(app.toLowerCase())) return false;

  // Auto-exclude transactional/service apps
  const transactionalApps = ['banking', 'bank', 'delivery', 'uber', 'lyft', 'food', 'health'];
  if (transactionalApps.some(t => app.toLowerCase().includes(t))) return false;

  // Uncertainty markers (more likely in outgoing messages you sent)
  const uncertaintyMarkers = [
    'not sure', 'weird', 'confused', 'unclear', 'strange',
    'did i', 'should i have', 'was that', 'awkward', '??'
  ];
  if (direction === 'outgoing' && uncertaintyMarkers.some(m => message.toLowerCase().includes(m))) {
    return true;
  }

  // Professional-ambiguous keywords
  const professionalKeywords = [
    'interview', 'opportunity', 'meeting', 'proposal', 'project',
    'collaboration', 'feedback', 'review', 'discuss', 'catch up'
  ];
  if (professionalKeywords.some(k => message.toLowerCase().includes(k))) {
    return true;
  }

  // Questions left unanswered (outgoing question, then silence)
  if (direction === 'outgoing' && message.includes('?')) {
    // Check if there's been a response from this contact in last 24 hours
    const contactHistory = await env.BRAIN_KV.get(`contact:${contact}`, 'json') || { interactions: [] };
    const recentInteractions = contactHistory.interactions.slice(-5);

    const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const hasRecentResponse = recentInteractions.some(id => {
      // This is simplified - in full implementation, we'd fetch each item
      return true; // Placeholder
    });

    if (!hasRecentResponse) return true;
  }

  // Long outgoing messages (might indicate over-explaining)
  if (direction === 'outgoing' && message.length > 500) {
    return true;
  }

  // Default: don't flag routine exchanges
  return false;
}

/**
 * Analyze interaction for signal reading
 */
async function analyzeSignal(item, env) {
  const { input: message, structured } = item;
  const { direction, app, contact } = structured;

  // Get contact history for context
  const contactHistory = await env.BRAIN_KV.get(`contact:${contact}`, 'json') || { interactions: [] };
  const recentIds = contactHistory.interactions.slice(-5);

  // Fetch recent interactions with this contact
  const recentInteractions = [];
  for (const id of recentIds) {
    if (id === item.id) continue; // Skip current item
    const interaction = await env.BRAIN_KV.get(`item:${id}`, 'json');
    if (interaction) {
      recentInteractions.push({
        date: interaction.createdAt.split('T')[0],
        direction: interaction.structured?.direction,
        message: interaction.input,
        app: interaction.structured?.app
      });
    }
  }

  // Get calibration notes
  const claudeNotes = await env.BRAIN_KV.get('claude:notes', 'json') || { notes: [] };
  const calibrationNotes = claudeNotes.notes
    .filter(n => n.category === 'signal-calibration')
    .map(n => n.content)
    .join('\n');

  const analysisPrompt = `You are analyzing a captured interaction for subtext and dynamics. This is part of a signal reading system to help the user recognize patterns they might miss.

INTERACTION:
Direction: ${direction}
App: ${app}
Contact: ${contact}
Message: ${message}
Date: ${item.createdAt}

RECENT HISTORY WITH ${contact}:
${recentInteractions.length > 0 ? recentInteractions.map(i =>
  `[${i.date}] ${i.direction} via ${i.app}: ${i.message}`
).join('\n') : '(no recent history)'}

CALIBRATION NOTES (what you've learned about analysis accuracy):
${calibrationNotes || '(none yet)'}

Analyze this interaction across these dimensions:

1. **Signal vs Noise**: Was this precise and context-aware, or vague and generic?
2. **Dependency/Urgency Leak**: Does it signal that stability depends on the outcome?
3. **Status Calibration**: Over-explaining (insecurity) or under-explaining (assumes alignment)?
4. **Purpose Clarity**: Was intent clear, or was this processing out loud?
5. **Constraint Awareness**: Did it show understanding of the other person's constraints?
6. **What Wasn't Said**: What got avoided or talked around?
7. **Power Direction**: Who adjusted to whom? Who set the frame?
8. **Time Horizon Mismatch**: Different timescales at play?
9. **Context Carry-Over**: How does history with this person affect subtext?
10. **What Worked**: What landed as intended?

Respond with JSON only:
{
  "contextType": "professional-ambiguous|operational-clear|personal-close|transactional",
  "keyDynamic": "One sentence summary of the core dynamic",
  "possibleSubtext": "One sentence about what might be happening beneath the surface",
  "whatWorked": "One sentence about what was effective (or null if nothing notable)",
  "patternNote": "Connection to recurring themes (or null)",
  "action": "review|noted|calibration-needed",
  "detailedAnalysis": {
    "signalVsNoise": "Brief assessment",
    "dependencyLeak": "Brief assessment",
    "statusCalibration": "Brief assessment",
    "purposeClarity": "Brief assessment",
    "constraintAwareness": "Brief assessment",
    "whatWasntSaid": "Brief assessment",
    "powerDirection": "Brief assessment",
    "timeHorizonMismatch": "Brief assessment",
    "contextCarryOver": "Brief assessment",
    "whatWorked": "Brief assessment"
  },
  "blindSpots": ["Patterns the user might be missing"],
  "questions": ["Curious questions that might spark reflection"]
}

CRITICAL: Be honest and insightful, not validating. Focus on what's interesting, not what's flattering. Use the calibration notes to adjust your analysis.`;

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
      console.error('Signal analysis API error:', response.status);
      return null;
    }

    const data = await response.json();
    const text = data.content[0].text;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);

      // Add metadata
      analysis.analyzedAt = new Date().toISOString();
      analysis.itemId = item.id;
      analysis.contact = contact;

      return analysis;
    }
  } catch (error) {
    console.error('Signal analysis error:', error);
    return null;
  }

  return null;
}

/**
 * Queue an interaction for signal analysis
 */
async function queueSignalAnalysis(item, env) {
  // Run analysis
  const analysis = await analyzeSignal(item, env);

  if (!analysis) {
    console.log('Failed to analyze signal for item:', item.id);
    return;
  }

  // Store analysis
  await env.BRAIN_KV.put(`signal:${item.id}`, JSON.stringify(analysis));

  // Add to priority queue
  const queue = await env.BRAIN_KV.get('signal-queue:all', 'json') || { items: [] };

  // Calculate priority score (higher = more important)
  let priority = 0;

  // Recent items get higher priority
  const ageHours = (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60);
  priority += Math.max(0, 48 - ageHours); // Newer = higher score

  // Action type affects priority
  if (analysis.action === 'calibration-needed') priority += 20;
  if (analysis.action === 'review') priority += 10;

  // Professional-ambiguous contexts get higher priority
  if (analysis.contextType === 'professional-ambiguous') priority += 15;

  queue.items.push({
    itemId: item.id,
    contact: item.structured.contact,
    timestamp: item.createdAt,
    priority: priority,
    reviewed: false
  });

  // Sort by priority (highest first)
  queue.items.sort((a, b) => b.priority - a.priority);

  // Keep only last 100 items
  if (queue.items.length > 100) {
    queue.items = queue.items.slice(0, 100);
  }

  await env.BRAIN_KV.put('signal-queue:all', JSON.stringify(queue));

  console.log(`Signal analysis queued for ${item.id} (priority: ${priority})`);
}

/**
 * Add interaction to contact history
 */
async function addToContactHistory(contact, itemId, env) {
  const history = await env.BRAIN_KV.get(`contact:${contact}`, 'json') || {
    contact: contact,
    interactions: [],
    firstSeen: new Date().toISOString()
  };

  history.interactions.push(itemId);
  history.lastSeen = new Date().toISOString();

  // Keep last 50 interactions per contact
  if (history.interactions.length > 50) {
    history.interactions = history.interactions.slice(-50);
  }

  await env.BRAIN_KV.put(`contact:${contact}`, JSON.stringify(history));
}

/**
 * Get signal readings queue
 */
async function handleGetSignals(url, env) {
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
  const reviewedFilter = url.searchParams.get('reviewed'); // 'true', 'false', or null (all)

  const queue = await env.BRAIN_KV.get('signal-queue:all', 'json') || { items: [] };

  let items = queue.items;

  // Filter by reviewed status if specified
  if (reviewedFilter === 'true') {
    items = items.filter(i => i.reviewed);
  } else if (reviewedFilter === 'false') {
    items = items.filter(i => !i.reviewed);
  }

  // Take top N by priority
  items = items.slice(0, limit);

  // Fetch full analysis and item data
  const signals = [];
  for (const queueItem of items) {
    const analysis = await env.BRAIN_KV.get(`signal:${queueItem.itemId}`, 'json');
    const item = await env.BRAIN_KV.get(`item:${queueItem.itemId}`, 'json');

    if (analysis && item) {
      signals.push({
        ...queueItem,
        analysis: analysis,
        item: item
      });
    }
  }

  return jsonResponse({
    signals: signals,
    count: signals.length,
    totalInQueue: queue.items.length
  });
}

/**
 * Add feedback to signal analysis
 */
async function handleSignalFeedback(itemId, request, env) {
  const body = await request.json();
  const { accurate, userRead, corrections } = body;

  // Get the analysis
  const analysis = await env.BRAIN_KV.get(`signal:${itemId}`, 'json');
  if (!analysis) {
    return jsonResponse({ error: 'Signal analysis not found' }, 404);
  }

  // Add feedback
  analysis.feedback = {
    accurate: accurate, // 'yes', 'partially', 'no'
    userRead: userRead, // User's own interpretation
    corrections: corrections, // What was wrong
    feedbackAt: new Date().toISOString()
  };

  // Save updated analysis
  await env.BRAIN_KV.put(`signal:${itemId}`, JSON.stringify(analysis));

  // Mark as reviewed in queue
  const queue = await env.BRAIN_KV.get('signal-queue:all', 'json') || { items: [] };
  const queueItem = queue.items.find(i => i.itemId === itemId);
  if (queueItem) {
    queueItem.reviewed = true;
    await env.BRAIN_KV.put('signal-queue:all', JSON.stringify(queue));
  }

  // Add calibration note if there were corrections
  if (corrections && (accurate === 'partially' || accurate === 'no')) {
    const calibrationNote = `Signal analysis calibration: ${corrections}`;

    const claudeNotes = await env.BRAIN_KV.get('claude:notes', 'json') || { notes: [] };
    claudeNotes.notes.push({
      id: generateId(),
      content: calibrationNote,
      category: 'signal-calibration',
      createdAt: new Date().toISOString(),
      expiresAt: null // Never expire calibration notes
    });

    if (claudeNotes.notes.length > 50) {
      claudeNotes.notes = claudeNotes.notes.slice(-50);
    }

    claudeNotes.lastUpdated = new Date().toISOString();
    await env.BRAIN_KV.put('claude:notes', JSON.stringify(claudeNotes));
  }

  return jsonResponse({
    success: true,
    message: 'Feedback recorded',
    analysis: analysis
  });
}

/**
 * Get exclusions
 */
async function handleGetExclusions(env) {
  const exclusions = await env.BRAIN_KV.get('signal-exclusions', 'json') || {
    contacts: [],
    apps: [],
    updatedAt: null
  };
  return jsonResponse(exclusions);
}

/**
 * Add exclusion
 */
async function handleAddExclusion(request, env) {
  const body = await request.json();
  const { type, value } = body; // type: 'contact' or 'app'

  if (!type || !value) {
    return jsonResponse({ error: 'Missing type or value' }, 400);
  }

  const exclusions = await env.BRAIN_KV.get('signal-exclusions', 'json') || {
    contacts: [],
    apps: []
  };

  if (type === 'contact') {
    if (!exclusions.contacts.includes(value.toLowerCase())) {
      exclusions.contacts.push(value.toLowerCase());
    }
  } else if (type === 'app') {
    if (!exclusions.apps.includes(value.toLowerCase())) {
      exclusions.apps.push(value.toLowerCase());
    }
  } else {
    return jsonResponse({ error: 'Invalid type (must be contact or app)' }, 400);
  }

  exclusions.updatedAt = new Date().toISOString();
  await env.BRAIN_KV.put('signal-exclusions', JSON.stringify(exclusions));

  return jsonResponse({
    success: true,
    exclusions: exclusions
  });
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
