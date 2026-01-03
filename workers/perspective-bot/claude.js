/**
 * Claude API Integration
 * Generates responses to Reddit comments using Claude
 */

import {
  CLAUDE_API_URL,
  CLAUDE_MODEL,
  CLAUDE_MAX_TOKENS,
  CLAUDE_SYSTEM_PROMPT,
  generateUserPrompt
} from './config.js';

/**
 * Generate a response to a comment using Claude API
 * Returns the response text, or null if Claude decided to skip
 */
export async function generateResponse(commentText, apiKey) {
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: CLAUDE_MAX_TOKENS,
      system: CLAUDE_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: generateUserPrompt(commentText)
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API failed: ${response.status} ${error}`);
  }

  const data = await response.json();

  // Extract the text response
  if (!data.content || !data.content[0] || !data.content[0].text) {
    throw new Error('Invalid response from Claude API');
  }

  const responseText = data.content[0].text.trim();

  // Check if Claude decided to skip this comment
  if (responseText === '[SKIP]') {
    return null;
  }

  return responseText;
}
