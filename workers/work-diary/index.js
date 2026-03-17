/**
 * Work Diary Worker
 *
 * Receives diary entries and time logs from the web app,
 * forwards them to Google Apps Script which writes to Google Sheets.
 *
 * Used by: /work-diary/
 *
 * Required secrets:
 *   APPS_SCRIPT_URL  - Google Apps Script web app deployment URL
 *   WORK_DIARY_TOKEN - Auth token (must match the one in the web app config)
 */

export default {
  async fetch(request, env, ctx) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors() });
    }

    const url = new URL(request.url);

    // Health check (no auth required)
    if (url.pathname === '/health') {
      return json({ status: 'ok', worker: 'work-diary' });
    }

    // Auth check
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!env.WORK_DIARY_TOKEN || token !== env.WORK_DIARY_TOKEN) {
      return json({ error: 'Unauthorized' }, 401);
    }

    if (!env.APPS_SCRIPT_URL) {
      return json({ error: 'APPS_SCRIPT_URL not configured' }, 500);
    }

    // POST /capture — forward entry to Apps Script
    if (request.method === 'POST' && url.pathname === '/capture') {
      try {
        const body = await request.json();

        // Validate
        if (!body.type || !['diary', 'times'].includes(body.type)) {
          return json({ error: 'type must be diary or times' }, 400);
        }
        if (body.type === 'diary' && !body.entry) {
          return json({ error: 'diary entries require an entry field' }, 400);
        }
        if (body.type === 'times' && !body.activity) {
          return json({ error: 'time entries require an activity field' }, 400);
        }

        // Forward to Apps Script
        const response = await fetch(env.APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          redirect: 'follow'  // Apps Script redirects on POST
        });

        const result = await response.json();
        return json(result, result.success ? 200 : 500);

      } catch (err) {
        return json({ error: err.message }, 500);
      }
    }

    return json({ error: 'Not found' }, 404);
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors(), 'Content-Type': 'application/json' }
  });
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}
