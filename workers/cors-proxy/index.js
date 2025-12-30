/**
 * CORS Proxy for Anthropic API
 *
 * This Cloudflare Worker acts as a proxy to enable browser-based applications
 * to communicate with the Anthropic API without CORS issues.
 *
 * Used by: Ekphrasis (image-to-poetry app)
 */

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed. Only POST requests are supported.', {
        status: 405,
        headers: corsHeaders()
      });
    }

    try {
      // Forward request to Anthropic API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: request.headers,
        body: request.body
      });

      // Get response data
      const data = await response.text();

      // Return with CORS headers
      return new Response(data, {
        status: response.status,
        headers: {
          ...corsHeaders(),
          'Content-Type': 'application/json',
        }
      });
    } catch (error) {
      console.error('Proxy error:', error);

      return new Response(JSON.stringify({
        error: 'Proxy error',
        message: error.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders(),
          'Content-Type': 'application/json',
        }
      });
    }
  }
};

/**
 * Generate CORS headers
 */
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * Handle CORS preflight OPTIONS requests
 */
function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}
