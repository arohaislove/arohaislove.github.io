/**
 * CORS Proxy for Anthropic API
 *
 * This Cloudflare Worker acts as a proxy to enable browser-based applications
 * to communicate with the Anthropic API without CORS issues.
 *
 * The API key is stored as an environment variable (ANTHROPIC_API_KEY) in the
 * worker configuration, so clients don't need to provide their own keys.
 *
 * Used by: Ekphrasis, Oneiros
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
      // Clone the request to avoid body already read issues
      const requestClone = request.clone();

      // Get the request body
      const requestBody = await requestClone.text();

      // Build headers for Anthropic API (exclude problematic headers)
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');

      // Use the API key from environment variable (Cloudflare secret)
      // This allows the worker to provide API access without exposing the key to clients
      if (!env.ANTHROPIC_API_KEY) {
        return new Response(JSON.stringify({
          error: 'Configuration error',
          message: 'ANTHROPIC_API_KEY not configured in worker environment'
        }), {
          status: 500,
          headers: {
            ...corsHeaders(),
            'Content-Type': 'application/json',
          }
        });
      }

      headers.set('x-api-key', env.ANTHROPIC_API_KEY);

      // Use latest API version or accept from request
      const anthropicVersion = request.headers.get('anthropic-version') || '2023-06-01';
      headers.set('anthropic-version', anthropicVersion);

      // Forward request to Anthropic API
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: headers,
        body: requestBody
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
