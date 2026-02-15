/**
 * SHEETS SYNC - Cloudflare Worker
 *
 * Reads data from Second Brain's KV store and pushes it directly
 * to Google Sheets using the Google Sheets API with service account auth.
 * No Apps Script needed.
 *
 * Endpoints:
 *   POST /sync       - Trigger a full sync to Google Sheets
 *   GET  /health     - Health check
 *   GET  /preview    - Preview what would be synced (JSON)
 *
 * Cron: Runs every 6 hours automatically
 *
 * Secrets:
 *   GOOGLE_SERVICE_ACCOUNT_KEY - Service account JSON
 *   SPREADSHEET_ID             - Target Google Sheet ID
 *
 * KV Binding:
 *   BRAIN_KV - Second Brain's KV namespace
 */

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);

    if (url.pathname === '/health') {
      let serviceAccountEmail = null;
      if (env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        try {
          const sa = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_KEY);
          serviceAccountEmail = sa.client_email;
        } catch (e) {
          serviceAccountEmail = 'error parsing key';
        }
      }

      return jsonResponse({
        status: 'ok',
        timestamp: new Date().toISOString(),
        kvConfigured: !!env.BRAIN_KV,
        sheetsConfigured: !!env.GOOGLE_SERVICE_ACCOUNT_KEY && !!env.SPREADSHEET_ID,
        serviceAccountEmail: serviceAccountEmail,
        shareInstructions: serviceAccountEmail
          ? `Open your Google Sheet → tap Share → paste this email: ${serviceAccountEmail} → set to Editor → tap Send`
          : 'GOOGLE_SERVICE_ACCOUNT_KEY not configured yet'
      });
    }

    if (url.pathname === '/preview' && request.method === 'GET') {
      return await handlePreview(env);
    }

    if (url.pathname === '/sync' && request.method === 'POST') {
      return await handleSync(env);
    }

    return jsonResponse({
      worker: 'sheets-sync',
      endpoints: {
        'POST /sync': 'Sync KV data to Google Sheets',
        'GET /preview': 'Preview data that would be synced',
        'GET /health': 'Health check'
      }
    });
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(syncToSheets(env));
  }
};

// ─── SYNC LOGIC ──────────────────────────────────────────────

async function handleSync(env) {
  try {
    const result = await syncToSheets(env);
    return jsonResponse(result);
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

async function handlePreview(env) {
  try {
    const data = await readAllFromKV(env);
    return jsonResponse({
      totalItems: data.items.length,
      byType: countByType(data.items),
      sampleHeaders: ['ID', 'Type', 'Input', 'Created At', 'Status', 'Source', 'AI Notes'],
      sampleRows: data.items.slice(0, 3).map(formatItemRow)
    });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}

async function syncToSheets(env) {
  if (!env.BRAIN_KV) {
    throw new Error('BRAIN_KV not configured');
  }
  if (!env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY not configured');
  }
  if (!env.SPREADSHEET_ID) {
    throw new Error('SPREADSHEET_ID not configured');
  }

  // 1. Read all data from KV
  const data = await readAllFromKV(env);

  // 2. Get Google access token
  const accessToken = await getGoogleAccessToken(env.GOOGLE_SERVICE_ACCOUNT_KEY);

  // 3. Prepare sheet data
  const sheets = buildSheetData(data);

  // 4. Write to Google Sheets
  const results = {};
  for (const [sheetName, rows] of Object.entries(sheets)) {
    await ensureSheet(env.SPREADSHEET_ID, accessToken, sheetName);
    await writeToSheet(env.SPREADSHEET_ID, accessToken, sheetName, rows);
    results[sheetName] = rows.length - 1; // minus header row
  }

  return {
    success: true,
    syncedAt: new Date().toISOString(),
    sheets: results
  };
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

function countByType(items) {
  const counts = {};
  items.forEach(item => {
    counts[item.type] = (counts[item.type] || 0) + 1;
  });
  return counts;
}

// ─── SHEET DATA FORMATTING ──────────────────────────────────

function buildSheetData(data) {
  const sheets = {};

  // Main items sheet
  const itemHeaders = ['ID', 'Type', 'Input', 'Created At', 'Status', 'Source', 'AI Notes', 'Structured Data'];
  const itemRows = [itemHeaders];
  for (const item of data.items) {
    itemRows.push(formatItemRow(item));
  }
  sheets['All Items'] = itemRows;

  // Per-type sheets for types with enough items
  const byType = {};
  data.items.forEach(item => {
    if (!byType[item.type]) byType[item.type] = [];
    byType[item.type].push(item);
  });

  for (const [type, items] of Object.entries(byType)) {
    if (items.length >= 2) {
      const typeHeaders = buildTypeHeaders(type);
      const typeRows = [typeHeaders];
      for (const item of items) {
        typeRows.push(formatTypedRow(type, item));
      }
      const sheetName = type.charAt(0).toUpperCase() + type.slice(1) + 's';
      sheets[sheetName] = typeRows;
    }
  }

  // Claude notes sheet
  if (data.claudeNotes.length > 0) {
    const noteHeaders = ['Note ID', 'Category', 'Content', 'Created At', 'Expires At'];
    const noteRows = [noteHeaders];
    for (const note of data.claudeNotes) {
      noteRows.push([
        note.id || '',
        note.category || '',
        note.content || '',
        note.createdAt || '',
        note.expiresAt || ''
      ]);
    }
    sheets['Claude Notes'] = noteRows;
  }

  return sheets;
}

function formatItemRow(item) {
  return [
    item.id || '',
    item.type || '',
    item.input || '',
    item.createdAt || '',
    item.status || '',
    item.source || '',
    item.aiNotes || '',
    item.structured ? JSON.stringify(item.structured) : ''
  ];
}

function buildTypeHeaders(type) {
  const base = ['ID', 'Input', 'Created At', 'Status', 'AI Notes'];
  switch (type) {
    case 'expense':
      return [...base, 'Amount', 'Currency', 'Category', 'Vendor'];
    case 'todo':
      return [...base, 'Priority', 'Due Date'];
    case 'calendar':
      return [...base, 'Date', 'Time', 'Location'];
    case 'comms':
      return [...base, 'Contact', 'App', 'Direction', 'Message Count'];
    default:
      return [...base, 'Structured Data'];
  }
}

function formatTypedRow(type, item) {
  const base = [
    item.id || '',
    item.input || '',
    item.createdAt || '',
    item.status || '',
    item.aiNotes || ''
  ];
  const s = item.structured || {};

  switch (type) {
    case 'expense':
      return [...base, s.amount || '', s.currency || 'NZD', s.category || '', s.vendor || ''];
    case 'todo':
      return [...base, s.priority || '', s.dueDate || ''];
    case 'calendar':
      return [...base, s.date || '', s.time || '', s.location || ''];
    case 'comms':
      return [...base, s.contactName || '', s.app || '', s.direction || '', s.messageCount || ''];
    default:
      return [...base, JSON.stringify(s)];
  }
}

// ─── GOOGLE SHEETS API ──────────────────────────────────────

async function getGoogleAccessToken(serviceAccountKeyJson) {
  const sa = JSON.parse(serviceAccountKeyJson);
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedClaims = base64url(JSON.stringify(claims));
  const signInput = `${encodedHeader}.${encodedClaims}`;

  // Import the private key
  const privateKey = await importPrivateKey(sa.private_key);

  // Sign the JWT
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signInput)
  );

  const encodedSignature = base64urlFromBuffer(signature);
  const jwt = `${signInput}.${encodedSignature}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
  });

  if (!tokenResponse.ok) {
    const err = await tokenResponse.text();
    throw new Error(`Google auth failed: ${err}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function importPrivateKey(pem) {
  // Strip PEM headers and decode
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');

  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  return await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

async function ensureSheet(spreadsheetId, accessToken, sheetName) {
  // First, check if sheet exists
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`;
  const metaResponse = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!metaResponse.ok) {
    const err = await metaResponse.text();
    throw new Error(`Failed to get spreadsheet metadata: ${err}`);
  }

  const meta = await metaResponse.json();
  const existing = meta.sheets.map(s => s.properties.title);

  if (existing.includes(sheetName)) {
    return; // Sheet already exists
  }

  // Create the sheet
  const addUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  const addResponse = await fetch(addUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requests: [{
        addSheet: {
          properties: { title: sheetName }
        }
      }]
    })
  });

  if (!addResponse.ok) {
    const err = await addResponse.text();
    throw new Error(`Failed to create sheet '${sheetName}': ${err}`);
  }
}

async function writeToSheet(spreadsheetId, accessToken, sheetName, rows) {
  const range = `'${sheetName}'`;

  // Clear existing data first
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`;
  await fetch(clearUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  // Write new data
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;
  const response = await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range: range,
      majorDimension: 'ROWS',
      values: rows
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to write to sheet '${sheetName}': ${err}`);
  }

  return await response.json();
}

// ─── UTILS ──────────────────────────────────────────────────

function base64url(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlFromBuffer(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json'
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
