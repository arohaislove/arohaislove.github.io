/**
 * SHEETS SYNC - Cloudflare Worker
 *
 * Reads entries from the Second Brain KV store, formats them by type,
 * and appends them to a Google Sheet using a service account.
 *
 * Endpoints:
 *   GET /sync          - Sync all unsynced entries to Google Sheets
 *   GET /sync/type?type=todo  - Sync a specific type only
 *   GET /health        - Health check
 *   GET /             - List available endpoints
 *
 * Secrets required:
 *   - GOOGLE_SERVICE_ACCOUNT_KEY: Full JSON key for the Google service account
 *   - SPREADSHEET_ID: The Google Sheet ID (from the sheet URL)
 *
 * KV namespace:
 *   - BRAIN_KV: Same namespace as the second-brain worker
 *
 * Used by: second-brain system (Google Sheets export)
 */

export default {
  // HTTP trigger (on-demand sync)
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/sync') {
      const result = await syncToSheets(env);
      return new Response(JSON.stringify(result, null, 2), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname === '/sync/type' && url.searchParams.get('type')) {
      const type = url.searchParams.get('type');
      const result = await syncToSheets(env, type);
      return new Response(JSON.stringify(result, null, 2), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      endpoints: {
        '/sync': 'Sync all unsynced entries to Google Sheets',
        '/sync/type?type=todo': 'Sync specific type (todo|expense|calendar|creative|note|person|project|comms|ai-conversation)',
        '/health': 'Health check',
      }
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  // Cron trigger (scheduled - daily at 6 AM UTC)
  async scheduled(event, env, ctx) {
    ctx.waitUntil(syncToSheets(env));
  },
};

// ─── Main Sync Logic ─────────────────────────────────────────────

async function syncToSheets(env, filterType = null) {
  const startTime = Date.now();
  const results = { synced: 0, errors: [], types: {} };

  try {
    // 1. Get Google access token
    const accessToken = await getGoogleAccessToken(env);

    // 2. Read all unsynced items from KV
    const items = await readUnsyncedItems(env, filterType);

    // 3. Group items by type
    const grouped = groupByType(items);

    // 4. Append each group to the appropriate sheet tab
    for (const [type, typeItems] of Object.entries(grouped)) {
      try {
        const sheetName = getSheetName(type);
        await ensureSheetExists(env.SPREADSHEET_ID, accessToken, sheetName, type);

        const rows = formatForSheet(type, typeItems);
        const appended = await appendToSheet(env.SPREADSHEET_ID, accessToken, sheetName, rows);

        // 5. Mark items as synced in KV
        await markAsSynced(env, typeItems);

        results.types[type] = { count: typeItems.length, appended };
        results.synced += typeItems.length;
      } catch (err) {
        results.errors.push({ type, error: err.message });
      }
    }

    results.duration_ms = Date.now() - startTime;
    results.timestamp = new Date().toISOString();

    // Store sync log in KV for debugging (keep 30 days)
    await env.BRAIN_KV.put(
      `sync_log:${Date.now()}`,
      JSON.stringify(results),
      { expirationTtl: 60 * 60 * 24 * 30 }
    );

    return results;
  } catch (err) {
    return { error: err.message, stack: err.stack, duration_ms: Date.now() - startTime };
  }
}

// ─── KV Store Operations ─────────────────────────────────────────

/**
 * Read all unsynced items from KV.
 *
 * The second-brain worker stores items as:
 *   key:   item:{id}
 *   value: { id, input, type, structured, aiNotes, source, createdAt, status }
 *
 * We use the index to find all item IDs, then fetch each one.
 * Items that have already been synced (sheetsSync: true) are skipped.
 */
async function readUnsyncedItems(env, filterType = null) {
  const items = [];

  // Use the type-specific index if filtering, otherwise use the main index
  let indexKey = 'index:all';
  if (filterType) {
    indexKey = `index:type:${filterType}`;
  }

  const indexData = await env.BRAIN_KV.get(indexKey, 'json');
  if (!indexData || !indexData.items || indexData.items.length === 0) {
    return items;
  }

  // Fetch each item by ID
  for (const id of indexData.items) {
    const item = await env.BRAIN_KV.get(`item:${id}`, 'json');
    if (!item) continue;

    // Skip already-synced items
    if (item.sheetsSync) continue;

    // If filtering by type and using the main index, check the type
    if (filterType && item.type !== filterType) continue;

    items.push(item);
  }

  return items;
}

/**
 * Mark items as synced by updating them in KV with a sheetsSync flag.
 */
async function markAsSynced(env, items) {
  for (const item of items) {
    const updated = {
      ...item,
      sheetsSync: true,
      sheetsSyncAt: new Date().toISOString(),
    };
    await env.BRAIN_KV.put(`item:${item.id}`, JSON.stringify(updated));
  }
}

// ─── Data Formatting ─────────────────────────────────────────────

function groupByType(items) {
  return items.reduce((groups, item) => {
    const type = item.type || 'uncategorized';
    if (!groups[type]) groups[type] = [];
    groups[type].push(item);
    return groups;
  }, {});
}

function getSheetName(type) {
  const mapping = {
    todo: 'Todos',
    expense: 'Expenses',
    calendar: 'Calendar',
    creative: 'Creative',
    note: 'Notes',
    person: 'People',
    project: 'Projects',
    comms: 'Communications',
    'ai-conversation': 'AI Conversations',
    uncategorized: 'Other',
  };
  return mapping[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Format items into rows for Google Sheets, based on their type.
 * Each type gets columns matched to its structured data fields.
 */
function formatForSheet(type, items) {
  switch (type) {
    case 'todo':
      return items.map((item) => [
        item.createdAt || '',
        item.structured?.task || item.input || '',
        item.structured?.priority || 'medium',
        item.structured?.dueHint || '',
        item.status || 'active',
        item.aiNotes || '',
        item.source || '',
      ]);

    case 'expense':
      return items.map((item) => [
        item.createdAt || '',
        item.input || '',
        item.structured?.amount || '',
        item.structured?.category || '',
        item.structured?.vendor || '',
        item.structured?.date || '',
        item.aiNotes || '',
      ]);

    case 'calendar':
      return items.map((item) => [
        item.createdAt || '',
        item.structured?.event || item.input || '',
        item.structured?.dateHint || '',
        item.structured?.timeHint || '',
        item.structured?.location || '',
        item.aiNotes || '',
      ]);

    case 'creative':
      return items.map((item) => [
        item.createdAt || '',
        item.structured?.content || item.input || '',
        item.structured?.theme || '',
        item.structured?.connectedTo || '',
        item.structured?.visualDescription || '',
        item.aiNotes || '',
      ]);

    case 'note':
      return items.map((item) => [
        item.createdAt || '',
        item.structured?.summary || item.input || '',
        (item.structured?.tags || []).join(', '),
        item.aiNotes || '',
        item.source || '',
      ]);

    case 'person':
      return items.map((item) => [
        item.createdAt || '',
        item.structured?.name || '',
        item.structured?.context || '',
        item.structured?.detail || item.input || '',
        item.aiNotes || '',
      ]);

    case 'project':
      return items.map((item) => [
        item.createdAt || '',
        item.structured?.project || '',
        item.structured?.update || item.input || '',
        item.structured?.nextAction || '',
        item.aiNotes || '',
      ]);

    case 'comms':
      return items.map((item) => [
        item.createdAt || '',
        item.input || '',
        item.structured?.contact || '',
        item.structured?.app || '',
        item.structured?.direction || '',
        item.aiNotes || '',
      ]);

    case 'ai-conversation':
      return items.map((item) => [
        item.createdAt || '',
        item.input?.substring(0, 500) || '',
        item.structured?.app || '',
        (item.structured?.topics || []).join(', '),
        (item.structured?.keyTakeaways || []).join('; '),
        (item.structured?.actionItems || []).join('; '),
        item.structured?.mood || '',
      ]);

    default:
      return items.map((item) => [
        item.createdAt || '',
        item.type || '',
        item.input || '',
        JSON.stringify(item.structured || {}),
        item.aiNotes || '',
      ]);
  }
}

function getHeadersForType(type) {
  switch (type) {
    case 'todo':
      return [['Timestamp', 'Task', 'Priority', 'Due Hint', 'Status', 'AI Notes', 'Source']];
    case 'expense':
      return [['Timestamp', 'Description', 'Amount', 'Category', 'Vendor', 'Date', 'AI Notes']];
    case 'calendar':
      return [['Timestamp', 'Event', 'Date Hint', 'Time Hint', 'Location', 'AI Notes']];
    case 'creative':
      return [['Timestamp', 'Content', 'Theme', 'Connected To', 'Visual Description', 'AI Notes']];
    case 'note':
      return [['Timestamp', 'Summary', 'Tags', 'AI Notes', 'Source']];
    case 'person':
      return [['Timestamp', 'Name', 'Context', 'Detail', 'AI Notes']];
    case 'project':
      return [['Timestamp', 'Project', 'Update', 'Next Action', 'AI Notes']];
    case 'comms':
      return [['Timestamp', 'Message', 'Contact', 'App', 'Direction', 'AI Notes']];
    case 'ai-conversation':
      return [['Timestamp', 'Content (truncated)', 'App', 'Topics', 'Key Takeaways', 'Action Items', 'Mood']];
    default:
      return [['Timestamp', 'Type', 'Content', 'Structured Data', 'AI Notes']];
  }
}

// ─── Google Sheets API ───────────────────────────────────────────

async function getGoogleAccessToken(env) {
  const serviceAccount = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const now = Math.floor(Date.now() / 1000);

  // Create JWT for Google OAuth
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const jwt = await signJWT(header, payload, serviceAccount.private_key);

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const err = await tokenResponse.text();
    throw new Error(`Failed to get access token: ${err}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function signJWT(header, payload, privateKeyPem) {
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await importPrivateKey(privateKeyPem);

  const signature = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    key,
    new TextEncoder().encode(signingInput)
  );

  const encodedSignature = base64urlEncode(signature);
  return `${signingInput}.${encodedSignature}`;
}

async function importPrivateKey(pem) {
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');

  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  return crypto.subtle.importKey(
    'pkcs8',
    binaryKey.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

function base64urlEncode(input) {
  let data;
  if (typeof input === 'string') {
    data = new TextEncoder().encode(input);
  } else if (input instanceof ArrayBuffer) {
    data = new Uint8Array(input);
  } else {
    data = input;
  }

  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function ensureSheetExists(spreadsheetId, accessToken, sheetName, type) {
  // Get existing sheet tabs
  const metaResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!metaResponse.ok) {
    throw new Error(`Failed to get spreadsheet metadata: ${await metaResponse.text()}`);
  }

  const meta = await metaResponse.json();
  const existingSheets = meta.sheets.map((s) => s.properties.title);

  if (!existingSheets.includes(sheetName)) {
    // Create the sheet tab
    const addRequest = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{ addSheet: { properties: { title: sheetName } } }],
        }),
      }
    );

    if (!addRequest.ok) {
      throw new Error(`Failed to create sheet tab '${sheetName}': ${await addRequest.text()}`);
    }

    // Add headers to the new tab
    const headers = getHeadersForType(type);
    await appendToSheet(spreadsheetId, accessToken, sheetName, headers);
  }
}

async function appendToSheet(spreadsheetId, accessToken, sheetName, rows) {
  if (!rows.length) return 0;

  // Batch in chunks of 500 rows to stay within API limits
  const BATCH_SIZE = 500;
  let totalAppended = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: batch }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Failed to append to sheet '${sheetName}': ${errText}`);
    }

    const result = await response.json();
    totalAppended += result.updates?.updatedRows || batch.length;
  }

  return totalAppended;
}
