/**
 * SHEETS SYNC - Cloudflare Worker
 *
 * Simple proxy that fetches data from a Google Sheet via Apps Script,
 * adds CORS headers so browser-based projects can access it,
 * and caches responses to reduce load.
 *
 * Endpoints:
 *   GET /        - Fetch all sheet data (cached 5 min)
 *   GET /fresh   - Fetch fresh data (bypass cache)
 *   GET /health  - Health check
 *
 * Environment variables:
 *   APPS_SCRIPT_URL - The deployed Google Apps Script web app URL
 *
 * Used by: Projects that need to read data from Google Sheets
 */

const CACHE_TTL = 300; // 5 minutes

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
    }

    if (url.pathname === '/' || url.pathname === '/fresh') {
      const skipCache = url.pathname === '/fresh';
      return fetchSheetData(env, ctx, skipCache);
    }

    return jsonResponse({
      endpoints: {
        '/': 'Fetch sheet data (cached 5 min)',
        '/fresh': 'Fetch fresh data (bypass cache)',
        '/health': 'Health check',
      },
    });
  },
};

async function fetchSheetData(env, ctx, skipCache = false) {
  const appsScriptUrl = env.APPS_SCRIPT_URL;

  if (!appsScriptUrl) {
    return jsonResponse(
      { error: 'APPS_SCRIPT_URL not configured' },
      500
    );
  }

  // Check cache first (unless skipping)
  if (!skipCache) {
    const cache = caches.default;
    const cacheKey = new Request('https://sheets-sync-cache/data');
    const cached = await cache.match(cacheKey);
    if (cached) {
      const response = new Response(cached.body, cached);
      response.headers.set('X-Cache', 'HIT');
      // Re-apply CORS headers in case they were stripped
      for (const [key, value] of Object.entries(corsHeaders())) {
        response.headers.set(key, value);
      }
      return response;
    }
  }

  try {
    // Fetch from Apps Script (follow redirects - Apps Script always redirects)
    const response = await fetch(appsScriptUrl, {
      method: 'GET',
      redirect: 'follow',
    });

    if (!response.ok) {
      return jsonResponse(
        { error: 'Failed to fetch sheet data', status: response.status },
        502
      );
    }

    const data = await response.text();

    // Build response with CORS headers
    const result = new Response(data, {
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${CACHE_TTL}`,
        'X-Cache': 'MISS',
      },
    });

    // Store in cache
    if (!skipCache) {
      const cache = caches.default;
      const cacheKey = new Request('https://sheets-sync-cache/data');
      ctx.waitUntil(cache.put(cacheKey, result.clone()));
    }

    return result;
  } catch (error) {
    return jsonResponse(
      { error: 'Failed to fetch sheet data', message: error.message },
      500
    );
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json',
    },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400',
  };
}
