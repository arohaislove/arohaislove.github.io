/**
 * SHEETS SYNC - Cloudflare Worker
 *
 * Reads data from Second Brain's KV store and serves it as CSV.
 * Use Google Sheets IMPORTDATA formula to pull data automatically.
 *
 * The Pool: One shared pool of knowledge that any AI can read from.
 * Gemini reads Google Sheets natively. This worker is the bridge.
 * Be kind and work hard.
 *
 * Endpoints:
 *   GET /csv              - All items as CSV
 *   GET /csv/notes        - Claude notes as CSV
 *   GET /csv/pool         - THE POOL: Rich combined view for AI consumption
 *   GET /csv/briefing     - Latest morning briefing as CSV
 *   GET /csv/:type        - Items filtered by type (expense, todo, calendar, comms, ai-conversation, etc.)
 *   GET /preview          - Preview data as JSON
 *   GET /health           - Health check
 *   GET /                 - Instructions page
 *
 * KV Binding:
 *   BRAIN_KV - Second Brain's KV namespace
 *
 * Usage in Google Sheets:
 *   =IMPORTDATA("https://sheets-sync.zammel.workers.dev/csv/pool")
 */

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/health') {
      return jsonResponse({
        status: 'ok',
        timestamp: new Date().toISOString(),
        kvConfigured: !!env.BRAIN_KV
      });
    }

    if (path === '/preview') {
      return await handlePreview(env);
    }

    if (path === '/csv') {
      return await handleCsv(env, 'all');
    }

    if (path === '/csv/notes') {
      return await handleNotesCsv(env);
    }

    if (path === '/csv/pool') {
      return await handlePoolCsv(env);
    }

    if (path === '/csv/briefing') {
      return await handleBriefingCsv(env);
    }

    if (path.startsWith('/csv/')) {
      const type = path.replace('/csv/', '');
      return await handleCsv(env, type);
    }

    // Landing page with instructions
    return new Response(landingPage(), {
      headers: { 'Content-Type': 'text/html', ...corsHeaders() }
    });
  }
};

// ─── CSV HANDLERS ────────────────────────────────────────────

async function handleCsv(env, type) {
  try {
    if (!env.BRAIN_KV) {
      return csvResponse('Error: KV not configured');
    }

    const data = await readAllFromKV(env);
    let items = data.items;

    if (type !== 'all') {
      items = items.filter(item => item.type === type);
    }

    const csv = itemsToCsv(items, type);
    return csvResponse(csv);
  } catch (error) {
    return csvResponse(`Error: ${error.message}`);
  }
}

async function handleNotesCsv(env) {
  try {
    if (!env.BRAIN_KV) {
      return csvResponse('Error: KV not configured');
    }

    const data = await readAllFromKV(env);
    const csv = notesToCsv(data.claudeNotes);
    return csvResponse(csv);
  } catch (error) {
    return csvResponse(`Error: ${error.message}`);
  }
}

/**
 * THE POOL - One big pool of information. Anybody can crawl across,
 * take what they need, give advice, learn. Be kind and work hard.
 *
 * This is the endpoint Gemini reads via Google Sheets IMPORTDATA.
 * It combines: recent items, AI conversations, Claude's working notes,
 * and the latest briefing context - all in one rich CSV.
 */
async function handlePoolCsv(env) {
  try {
    if (!env.BRAIN_KV) {
      return csvResponse('Error: KV not configured');
    }

    const data = await readAllFromKV(env);
    const briefing = await env.BRAIN_KV.get('briefing:latest', 'json');

    const rows = [];

    // Section 1: Pool header - context for any AI reading this
    rows.push(rowToCsv(['=== THE POOL ===', '', '', '', '']));
    rows.push(rowToCsv(['Section', 'Key', 'Value', 'Timestamp', 'Details']));
    rows.push(rowToCsv(['CONTEXT', 'What is this?', 'Dave\'s Second Brain - a shared knowledge pool. All AI assistants (Claude and Gemini and Kimi and others) contribute here. Read freely and use what helps. Be kind and work hard.', new Date().toISOString(), '']));
    rows.push(rowToCsv(['CONTEXT', 'Total items in pool', String(data.items.length), '', '']));
    rows.push(rowToCsv(['CONTEXT', 'Claude working notes', String(data.claudeNotes.length), '', '']));
    rows.push(rowToCsv(['CONTEXT', 'Last updated', new Date().toISOString(), '', '']));

    // Section 2: Latest briefing summary
    rows.push(rowToCsv(['', '', '', '', '']));
    rows.push(rowToCsv(['=== LATEST BRIEFING ===', '', '', '', '']));
    if (briefing) {
      // Split briefing into chunks that fit in cells (max ~1000 chars per cell for readability)
      const briefingText = briefing.briefing || '';
      const briefingChunks = chunkText(briefingText, 1000);
      rows.push(rowToCsv(['BRIEFING', 'Date', briefing.date || '', briefing.timestamp || '', '']));
      for (let i = 0; i < briefingChunks.length; i++) {
        rows.push(rowToCsv(['BRIEFING', `Part ${i + 1}`, briefingChunks[i], '', '']));
      }
    } else {
      rows.push(rowToCsv(['BRIEFING', 'Status', 'No briefing generated yet', '', '']));
    }

    // Section 3: Claude's working memory (notes to self)
    rows.push(rowToCsv(['', '', '', '', '']));
    rows.push(rowToCsv(['=== CLAUDE WORKING MEMORY ===', '', '', '', '']));
    if (data.claudeNotes.length > 0) {
      for (const note of data.claudeNotes) {
        rows.push(rowToCsv(['CLAUDE_NOTE', note.category || 'general', note.content, note.createdAt, note.expiresAt || 'no expiry']));
      }
    } else {
      rows.push(rowToCsv(['CLAUDE_NOTE', 'Status', 'No working memory yet', '', '']));
    }

    // Section 4: AI Conversations (the cross-AI knowledge)
    rows.push(rowToCsv(['', '', '', '', '']));
    rows.push(rowToCsv(['=== AI CONVERSATIONS ===', '', '', '', '']));
    const aiConvos = data.items.filter(i => i.type === 'ai-conversation');
    if (aiConvos.length > 0) {
      for (const item of aiConvos) {
        const s = item.structured || {};
        const topics = (s.topics || []).join('; ');
        const takeaways = (s.keyTakeaways || []).join('; ');
        const actions = (s.actionItems || []).join('; ');
        rows.push(rowToCsv([
          'AI_CONVO',
          s.app || 'unknown',
          `Topics: ${topics || 'none'} | Takeaways: ${takeaways || 'none'} | Actions: ${actions || 'none'} | Mood: ${s.mood || 'unknown'}`,
          item.createdAt,
          item.aiNotes || ''
        ]));
      }
    } else {
      rows.push(rowToCsv(['AI_CONVO', 'Status', 'No AI conversations captured yet', '', '']));
    }

    // Section 5: Recent captures (last 30, newest first)
    rows.push(rowToCsv(['', '', '', '', '']));
    rows.push(rowToCsv(['=== RECENT CAPTURES ===', '', '', '', '']));
    const recentItems = data.items
      .filter(i => i.type !== 'ai-conversation')
      .slice(-30)
      .reverse();

    if (recentItems.length > 0) {
      for (const item of recentItems) {
        const s = item.structured || {};
        let detail = '';

        // Build a context-rich detail string based on type
        switch (item.type) {
          case 'todo':
            detail = `Priority: ${s.priority || '?'} | Due: ${s.dueHint || s.dueDate || 'none'}`;
            break;
          case 'expense':
            detail = `Amount: ${s.amount || '?'} ${s.currency || 'NZD'} | Category: ${s.category || '?'} | Vendor: ${s.vendor || '?'}`;
            break;
          case 'calendar':
            detail = `Date: ${s.dateHint || s.date || '?'} | Time: ${s.timeHint || s.time || '?'} | Location: ${s.location || '?'}`;
            break;
          case 'comms':
            detail = `${s.direction || '?'} via ${s.app || '?'} with ${s.contact || '?'}`;
            break;
          case 'creative':
            detail = `Theme: ${s.theme || '?'} | Connected to: ${s.connectedTo || 'nothing yet'}`;
            break;
          case 'person':
            detail = `Name: ${s.name || '?'} | Context: ${s.context || '?'}`;
            break;
          case 'project':
            detail = `Project: ${s.project || '?'} | Next: ${s.nextAction || '?'}`;
            break;
          default:
            detail = JSON.stringify(s).slice(0, 200);
        }

        rows.push(rowToCsv([
          item.type.toUpperCase(),
          item.input ? item.input.slice(0, 300) : '',
          detail,
          item.createdAt,
          item.aiNotes || ''
        ]));
      }
    } else {
      rows.push(rowToCsv(['CAPTURE', 'Status', 'No captures yet', '', '']));
    }

    return csvResponse(rows.join('\n'));
  } catch (error) {
    return csvResponse(`Error: ${error.message}`);
  }
}

/**
 * BRIEFING - Latest morning briefing as CSV
 */
async function handleBriefingCsv(env) {
  try {
    if (!env.BRAIN_KV) {
      return csvResponse('Error: KV not configured');
    }

    const briefing = await env.BRAIN_KV.get('briefing:latest', 'json');

    const rows = [];
    rows.push(rowToCsv(['Date', 'Generated At', 'Briefing Content']));

    if (briefing) {
      // Split long briefing into multiple rows if needed
      const briefingText = briefing.briefing || '';
      const chunks = chunkText(briefingText, 2000);
      for (let i = 0; i < chunks.length; i++) {
        rows.push(rowToCsv([
          briefing.date || '',
          i === 0 ? (briefing.timestamp || '') : '(continued)',
          chunks[i]
        ]));
      }
    } else {
      rows.push(rowToCsv(['', '', 'No briefing generated yet']));
    }

    return csvResponse(rows.join('\n'));
  } catch (error) {
    return csvResponse(`Error: ${error.message}`);
  }
}

async function handlePreview(env) {
  try {
    if (!env.BRAIN_KV) {
      return jsonResponse({ error: 'KV not configured' }, 500);
    }

    const data = await readAllFromKV(env);
    const types = {};
    data.items.forEach(item => {
      types[item.type] = (types[item.type] || 0) + 1;
    });

    return jsonResponse({
      totalItems: data.items.length,
      totalNotes: data.claudeNotes.length,
      byType: types,
      availableCsvEndpoints: {
        '/csv': 'All items',
        '/csv/pool': 'THE POOL - Rich combined view for AI consumption (Gemini reads this)',
        '/csv/notes': 'Claude working memory notes',
        '/csv/briefing': 'Latest morning briefing',
        '/csv/ai-conversation': 'AI conversations (Claude, Gemini, Kimi, etc.)',
        ...Object.keys(types).reduce((acc, t) => {
          acc[`/csv/${t}`] = `${t} items only`;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

// ─── KV DATA READING ────────────────────────────────────────

async function readAllFromKV(env) {
  const allIndex = await env.BRAIN_KV.get('index:all', 'json') || { items: [] };
  const claudeNotes = await env.BRAIN_KV.get('claude:notes', 'json') || { notes: [] };

  const items = [];
  for (const id of allIndex.items) {
    const item = await env.BRAIN_KV.get(`item:${id}`, 'json');
    if (item) items.push(item);
  }

  return { items, claudeNotes: claudeNotes.notes || [] };
}

// ─── CSV FORMATTING ─────────────────────────────────────────

function escapeCsv(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function rowToCsv(fields) {
  return fields.map(escapeCsv).join(',');
}

function itemsToCsv(items, type) {
  if (items.length === 0) {
    return 'No items found';
  }

  const rows = [];

  if (type !== 'all' && ['expense', 'todo', 'calendar', 'comms', 'ai-conversation'].includes(type)) {
    // Type-specific headers with structured data columns
    switch (type) {
      case 'expense':
        rows.push(rowToCsv(['ID', 'Input', 'Created', 'Status', 'AI Notes', 'Amount', 'Currency', 'Category', 'Vendor']));
        for (const item of items) {
          const s = item.structured || {};
          rows.push(rowToCsv([item.id, item.input, item.createdAt, item.status, item.aiNotes, s.amount, s.currency || 'NZD', s.category, s.vendor]));
        }
        break;
      case 'todo':
        rows.push(rowToCsv(['ID', 'Input', 'Created', 'Status', 'AI Notes', 'Priority', 'Due Date']));
        for (const item of items) {
          const s = item.structured || {};
          rows.push(rowToCsv([item.id, item.input, item.createdAt, item.status, item.aiNotes, s.priority, s.dueDate]));
        }
        break;
      case 'calendar':
        rows.push(rowToCsv(['ID', 'Input', 'Created', 'Status', 'AI Notes', 'Date', 'Time', 'Location']));
        for (const item of items) {
          const s = item.structured || {};
          rows.push(rowToCsv([item.id, item.input, item.createdAt, item.status, item.aiNotes, s.date, s.time, s.location]));
        }
        break;
      case 'comms':
        rows.push(rowToCsv(['ID', 'Input', 'Created', 'Status', 'AI Notes', 'Contact', 'App', 'Direction', 'Message Count']));
        for (const item of items) {
          const s = item.structured || {};
          rows.push(rowToCsv([item.id, item.input, item.createdAt, item.status, item.aiNotes, s.contactName, s.app, s.direction, s.messageCount]));
        }
        break;
      case 'ai-conversation':
        rows.push(rowToCsv(['ID', 'Created', 'AI App', 'Mood', 'Topics', 'Key Takeaways', 'Action Items', 'AI Notes', 'Raw Input']));
        for (const item of items) {
          const s = item.structured || {};
          rows.push(rowToCsv([
            item.id,
            item.createdAt,
            s.app || 'unknown',
            s.mood || '',
            (s.topics || []).join('; '),
            (s.keyTakeaways || []).join('; '),
            (s.actionItems || []).join('; '),
            item.aiNotes,
            item.input
          ]));
        }
        break;
    }
  } else {
    // Generic headers
    rows.push(rowToCsv(['ID', 'Type', 'Input', 'Created', 'Status', 'Source', 'AI Notes']));
    for (const item of items) {
      rows.push(rowToCsv([item.id, item.type, item.input, item.createdAt, item.status, item.source, item.aiNotes]));
    }
  }

  return rows.join('\n');
}

function notesToCsv(notes) {
  if (notes.length === 0) {
    return 'No notes found';
  }

  const rows = [];
  rows.push(rowToCsv(['Note ID', 'Category', 'Content', 'Created', 'Expires']));
  for (const note of notes) {
    rows.push(rowToCsv([note.id, note.category, note.content, note.createdAt, note.expiresAt]));
  }
  return rows.join('\n');
}

// ─── LANDING PAGE ────────────────────────────────────────────

function landingPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sheets Sync - The Pool</title>
<style>
  body { font-family: -apple-system, sans-serif; max-width: 600px; margin: 40px auto; padding: 0 20px; background: #0d1117; color: #c9d1d9; }
  h1 { color: #58a6ff; }
  h2 { color: #c9d1d9; margin-top: 24px; }
  code { background: #161b22; padding: 2px 8px; border-radius: 4px; color: #79c0ff; }
  pre { background: #161b22; padding: 16px; border-radius: 8px; overflow-x: auto; }
  .step { background: #161b22; padding: 16px; border-radius: 8px; margin: 12px 0; border-left: 3px solid #58a6ff; }
  .pool { border-left-color: #f0883e; }
  a { color: #58a6ff; }
  .motto { color: #8b949e; font-style: italic; margin: 8px 0 24px 0; }
</style>
</head>
<body>
<h1>The Pool</h1>
<p class="motto">One pool of knowledge. Anybody can crawl across, take what they need, give advice, learn. Be kind and work hard.</p>

<h2>For Gemini (The Pool)</h2>
<div class="step pool">
  <strong>The big one.</strong> Import this into Google Sheets and Gemini can read everything:<br><br>
  <pre>=IMPORTDATA("https://sheets-sync.zammel.workers.dev/csv/pool")</pre>
  <p>Contains: recent captures, AI conversation insights, Claude's working memory, latest briefing context - all in one view.</p>
</div>

<h2>Quick Setup</h2>
<div class="step">
  <strong>1.</strong> Open Google Sheets<br>
  <strong>2.</strong> Tap cell A1<br>
  <strong>3.</strong> Paste any formula below<br>
  <strong>4.</strong> Done! Data auto-refreshes.
</div>

<h2>All Available Feeds</h2>
<div class="step">
  <code>/csv/pool</code> — THE POOL: Everything combined for AI consumption<br>
  <code>/csv</code> — All items (raw)<br>
  <code>/csv/ai-conversation</code> — AI conversations (Claude, Gemini, Kimi, etc.)<br>
  <code>/csv/briefing</code> — Latest morning briefing<br>
  <code>/csv/notes</code> — Claude's working memory<br>
  <code>/csv/expense</code> — Expenses<br>
  <code>/csv/todo</code> — Todos<br>
  <code>/csv/calendar</code> — Calendar items<br>
  <code>/csv/comms</code> — Communications
</div>

<p><strong>Tip:</strong> Use separate tabs for each feed. The Pool tab is the one to share with Gemini.</p>

<h2>Links</h2>
<p><a href="/preview">Preview data as JSON</a> · <a href="/csv/pool">View the pool (CSV)</a> · <a href="/csv">View raw CSV</a> · <a href="/health">Health check</a></p>
</body>
</html>`;
}

// ─── TEXT HELPERS ────────────────────────────────────────────

function chunkText(text, maxLen) {
  if (!text) return [''];
  if (text.length <= maxLen) return [text];
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    // Try to break at a newline or space near the limit
    let breakAt = maxLen;
    if (remaining.length > maxLen) {
      const newlineIdx = remaining.lastIndexOf('\n', maxLen);
      const spaceIdx = remaining.lastIndexOf(' ', maxLen);
      breakAt = newlineIdx > maxLen * 0.5 ? newlineIdx : (spaceIdx > maxLen * 0.5 ? spaceIdx : maxLen);
    }
    chunks.push(remaining.slice(0, breakAt));
    remaining = remaining.slice(breakAt).trimStart();
  }
  return chunks;
}

// ─── UTILS ───────────────────────────────────────────────────

function csvResponse(csv) {
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      ...corsHeaders()
    }
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
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
