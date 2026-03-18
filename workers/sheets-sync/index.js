/**
 * SHEETS SYNC - Cloudflare Worker
 *
 * Reads data from Second Brain's KV store and serves it as CSV.
 * Use Google Sheets IMPORTDATA formula to pull data automatically.
 *
 * Endpoints:
 *   GET /csv              - All items as CSV
 *   GET /csv/recent       - Last 7 days only (use this for IMPORTDATA - stays under size limit)
 *   GET /csv/notes        - Claude notes as CSV
 *   GET /csv/:type        - Items filtered by type (expense, todo, calendar, comms, etc.)
 *   GET /preview          - Preview data as JSON
 *   GET /health           - Health check
 *   GET /                 - Instructions page
 *
 * KV Binding:
 *   BRAIN_KV - Second Brain's KV namespace
 *
 * Cron: Every Sunday 6pm UTC (Monday 7am NZT) - sends weekly digest via ntfy
 *
 * Usage in Google Sheets (recommended - stays small):
 *   =IMPORTDATA("https://sheets-sync.zammel.workers.dev/csv/recent")
 */

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const days = parseInt(url.searchParams.get('days') || '7', 10);

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
      return await handleCsv(env, 'all', null);
    }

    if (path === '/csv/recent') {
      return await handleCsv(env, 'all', days);
    }

    if (path === '/csv/notes') {
      return await handleNotesCsv(env);
    }

    if (path.startsWith('/csv/')) {
      const type = path.replace('/csv/', '');
      return await handleCsv(env, type, null);
    }

    // Landing page with instructions
    return new Response(landingPage(), {
      headers: { 'Content-Type': 'text/html', ...corsHeaders() }
    });
  },

  // Weekly cron: sends a digest to ntfy so you get a Monday morning summary
  async scheduled(event, env, ctx) {
    try {
      const data = await readAllFromKV(env);
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const weekItems = data.items.filter(item => new Date(item.createdAt) > cutoff);

      if (!env.NTFY_TOPIC || weekItems.length === 0) return;

      // Count by type
      const counts = {};
      weekItems.forEach(item => {
        counts[item.type] = (counts[item.type] || 0) + 1;
      });

      const summary = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([type, n]) => `${n} ${type}`)
        .join(', ');

      const message = `${weekItems.length} captures this week: ${summary}\n\nOpen your sheet to see it all.`;

      await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, {
        method: 'POST',
        headers: {
          'Title': '📊 Weekly Second Brain Digest',
          'Tags': 'brain,weekly',
          'Priority': '2',
          'Content-Type': 'text/plain'
        },
        body: message
      });
    } catch (e) {
      // Cron failures are silent - don't break anything
    }
  }
};

// ─── CSV HANDLERS ────────────────────────────────────────────

async function handleCsv(env, type, recentDays) {
  try {
    if (!env.BRAIN_KV) {
      return csvResponse('Error: KV not configured');
    }

    const data = await readAllFromKV(env);
    let items = data.items;

    // Filter by recency if requested
    if (recentDays) {
      const cutoff = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);
      items = items.filter(item => new Date(item.createdAt) > cutoff);
    }

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
        '/csv/notes': 'Claude notes',
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
  // Read snapshot + notes in parallel (2 KV reads total, not N)
  const [snapshot, claudeNotes] = await Promise.all([
    env.BRAIN_KV.get('items:snapshot', 'json'),
    env.BRAIN_KV.get('claude:notes', 'json')
  ]);

  return {
    items: snapshot?.items || [],
    claudeNotes: claudeNotes?.notes || []
  };
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

  if (type !== 'all' && ['expense', 'todo', 'calendar', 'comms', 'calorie'].includes(type)) {
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
      case 'calorie':
        rows.push(rowToCsv(['ID', 'Created', 'Meal Type', 'Foods', 'Estimated Calories', 'Confidence', 'AI Notes']));
        for (const item of items) {
          const s = item.structured || {};
          const foods = Array.isArray(s.foods) ? s.foods.join('; ') : (s.foods || item.input);
          rows.push(rowToCsv([item.id, item.createdAt, s.mealType, foods, s.estimatedCalories, s.confidence, item.aiNotes]));
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
<title>Sheets Sync</title>
<style>
  body { font-family: -apple-system, sans-serif; max-width: 600px; margin: 40px auto; padding: 0 20px; background: #0d1117; color: #c9d1d9; }
  h1 { color: #58a6ff; }
  code { background: #161b22; padding: 2px 8px; border-radius: 4px; color: #79c0ff; }
  pre { background: #161b22; padding: 16px; border-radius: 8px; overflow-x: auto; }
  .step { background: #161b22; padding: 16px; border-radius: 8px; margin: 12px 0; border-left: 3px solid #58a6ff; }
  a { color: #58a6ff; }
</style>
</head>
<body>
<h1>Sheets Sync</h1>
<p>Sync your Second Brain data to Google Sheets with one formula.</p>

<h2>Setup (30 seconds)</h2>
<div class="step">
  <strong>1.</strong> Open Google Sheets (new or existing)<br>
  <strong>2.</strong> Tap cell A1<br>
  <strong>3.</strong> Paste this formula (last 7 days — stays small and fast):
  <pre>=IMPORTDATA("https://sheets-sync.zammel.workers.dev/csv/recent")</pre>
  <strong>4.</strong> Done! Refreshes automatically when you open the sheet.<br><br>
  <em>For all-time history: <code>=IMPORTDATA("https://sheets-sync.zammel.workers.dev/csv")</code> — note this may be slow for large data</em>
</div>

<h2>Available Feeds</h2>
<div class="step">
  <code>/csv/recent</code> — Last 7 days (recommended for IMPORTDATA)<br>
  <code>/csv/recent?days=30</code> — Last 30 days<br>
  <code>/csv</code> — All items (may be slow)<br>
  <code>/csv/expense</code> — Expenses only<br>
  <code>/csv/todo</code> — Todos only<br>
  <code>/csv/calendar</code> — Calendar items<br>
  <code>/csv/comms</code> — Communications<br>
  <code>/csv/calorie</code> — Calorie log<br>
  <code>/csv/notes</code> — Claude's notes
</div>

<p><strong>Weekly digest:</strong> Every Monday morning you'll get a ntfy notification summarising what was captured during the week.</p>
<p><strong>Tip:</strong> Use separate sheets/tabs for each feed. Put one IMPORTDATA formula per tab.</p>

<h2>Links</h2>
<p><a href="/preview">Preview data as JSON</a> · <a href="/csv">View raw CSV</a> · <a href="/health">Health check</a></p>
</body>
</html>`;
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
