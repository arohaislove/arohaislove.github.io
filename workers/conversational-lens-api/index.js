/**
 * Conversational Lens API
 *
 * Cloudflare Worker that analyzes conversations through multiple analytical frameworks:
 * - Transactional Analysis (TA)
 * - Speech Acts
 * - Emotional Register
 *
 * Used by: Conversational Lens project
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
      // Get the request body
      const { conversation } = await request.json();

      if (!conversation || typeof conversation !== 'string') {
        return new Response(JSON.stringify({
          error: 'Invalid request',
          message: 'Please provide a "conversation" field containing the conversation text'
        }), {
          status: 400,
          headers: {
            ...corsHeaders(),
            'Content-Type': 'application/json',
          }
        });
      }

      // Parse the conversation into utterances
      const utterances = parseConversation(conversation);

      if (utterances.length === 0) {
        return new Response(JSON.stringify({
          error: 'Empty conversation',
          message: 'No utterances found in the conversation'
        }), {
          status: 400,
          headers: {
            ...corsHeaders(),
            'Content-Type': 'application/json',
          }
        });
      }

      // Build the analysis prompt
      const analysisPrompt = buildAnalysisPrompt(utterances);

      // Call Claude API
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

      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      headers.set('x-api-key', env.ANTHROPIC_API_KEY);
      headers.set('anthropic-version', '2023-06-01');

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 4096,
          messages: [{
            role: 'user',
            content: analysisPrompt
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return new Response(JSON.stringify({
          error: 'API error',
          message: errorText
        }), {
          status: response.status,
          headers: {
            ...corsHeaders(),
            'Content-Type': 'application/json',
          }
        });
      }

      const data = await response.json();
      const analysisText = data.content[0].text;

      // Parse the JSON response from Claude
      let analysis;
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/) ||
                         analysisText.match(/```\s*([\s\S]*?)\s*```/);

        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[1]);
        } else {
          analysis = JSON.parse(analysisText);
        }
      } catch (parseError) {
        return new Response(JSON.stringify({
          error: 'Parse error',
          message: 'Failed to parse analysis response',
          raw: analysisText
        }), {
          status: 500,
          headers: {
            ...corsHeaders(),
            'Content-Type': 'application/json',
          }
        });
      }

      // Return the analysis
      return new Response(JSON.stringify(analysis), {
        status: 200,
        headers: {
          ...corsHeaders(),
          'Content-Type': 'application/json',
        }
      });

    } catch (error) {
      console.error('Worker error:', error);

      return new Response(JSON.stringify({
        error: 'Worker error',
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
 * Parse conversation text into utterances
 * Supports multiple formats:
 * - Lines with speaker labels: "Alice: Hello there"
 * - Alternating lines (assigns A/B speakers)
 * - Mixed formats
 */
function parseConversation(text) {
  const lines = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const utterances = [];
  let currentSpeaker = 'A';
  let speakerToggle = true;

  for (const line of lines) {
    // Check for explicit speaker label (e.g., "Alice:", "Bob:", "A:", "B:")
    const match = line.match(/^([^:]+):\s*(.+)$/);

    if (match) {
      const speaker = match[1].trim();
      const text = match[2].trim();
      utterances.push({ speaker, text });
    } else {
      // No label, use alternating A/B
      utterances.push({
        speaker: speakerToggle ? 'A' : 'B',
        text: line
      });
      speakerToggle = !speakerToggle;
    }
  }

  return utterances;
}

/**
 * Build the analysis prompt for Claude
 */
function buildAnalysisPrompt(utterances) {
  const utterancesList = utterances.map((u, i) =>
    `${i}. ${u.speaker}: ${u.text}`
  ).join('\n');

  return `You are an expert in conversational analysis. Analyze the following conversation through three analytical lenses:

1. **Transactional Analysis (TA)**: Identify the ego state and transaction type
   - Ego states: Parent-Critical, Parent-Nurturing, Adult, Child-Free, Child-Adaptive
   - Transaction types: complementary, crossed, ulterior

2. **Speech Acts**: Identify the primary speech act and any indirect acts
   - Primary types: requesting, asserting, promising, expressing, declaring
   - Note if the surface act differs from the underlying intent

3. **Emotional Register**: Identify surface and underlying emotions
   - Surface emotion: what's expressed outwardly
   - Underlying emotion: what might be felt beneath (if different)
   - Intensity: 1-5 scale

Conversation:
${utterancesList}

Return your analysis as valid JSON following this exact schema:

{
  "utterances": [
    {
      "index": 0,
      "speaker": "A",
      "text": "exact text of utterance",
      "lenses": {
        "transactional_analysis": {
          "ego_state": "Parent-Critical|Parent-Nurturing|Adult|Child-Free|Child-Adaptive",
          "transaction_type": "complementary|crossed|ulterior"
        },
        "speech_act": {
          "primary": "requesting|asserting|promising|expressing|declaring",
          "indirect": "requesting|asserting|promising|expressing|declaring|none"
        },
        "emotional_register": {
          "surface": "emotion name",
          "underlying": "emotion name or same",
          "intensity": 1-5
        }
      }
    }
  ]
}

IMPORTANT:
- Return ONLY valid JSON, no additional text or markdown
- Include ALL ${utterances.length} utterances in your response
- Use lowercase for all enum values
- Be nuanced and thoughtful in your analysis
- Consider context from previous utterances when analyzing`;
}

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
