/**
 * Perspective Engine Reddit Bot
 *
 * A Cloudflare Worker that monitors a Reddit post and replies to comments
 * using Claude API for lighthearted, contemplative responses in the spirit
 * of the Perspective Engine memento mori visualization.
 *
 * Runs every 10 minutes via cron trigger.
 */

import {
  getRedditAccessToken,
  fetchComments,
  postReply,
  hasReplied,
  markAsReplied
} from './reddit.js';

import { generateResponse } from './claude.js';

import {
  MAX_REPLIES_PER_RUN,
  MIN_DELAY_SECONDS,
  MAX_DELAY_SECONDS,
  KV_TTL_SECONDS
} from './config.js';

/**
 * Main entry point for the worker
 */
export default {
  /**
   * HTTP handler for manual testing
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Manual trigger for testing
    if (url.pathname === '/test') {
      try {
        await handleCron(env, ctx);
        return new Response('Cron executed manually. Check logs for details.', {
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      } catch (error) {
        return new Response(`Error: ${error.message}`, {
          status: 500,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    }

    // Default response
    return new Response('Perspective Engine Reddit Bot is running.\n\nEndpoints:\n- /test - Manual trigger (for testing)', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  },

  /**
   * Cron trigger handler (runs every 10 minutes)
   */
  async scheduled(event, env, ctx) {
    await handleCron(env, ctx);
  }
};

/**
 * Main cron logic
 */
async function handleCron(env, ctx) {
  console.log('🤖 Perspective Bot: Cron triggered at', new Date().toISOString());

  // Check if REDDIT_POST_ID is configured
  if (!env.REDDIT_POST_ID) {
    console.log('⚠️  REDDIT_POST_ID not configured. Bot is in standby mode.');
    return;
  }

  // Validate required environment variables
  const requiredEnvVars = [
    'REDDIT_CLIENT_ID',
    'REDDIT_CLIENT_SECRET',
    'REDDIT_USERNAME',
    'REDDIT_PASSWORD',
    'ANTHROPIC_API_KEY'
  ];

  for (const varName of requiredEnvVars) {
    if (!env[varName]) {
      console.error(`❌ Missing required environment variable: ${varName}`);
      return;
    }
  }

  try {
    // Get Reddit access token
    console.log('🔑 Getting Reddit access token...');
    const accessToken = await getRedditAccessToken(env);

    // Fetch comments from the post
    console.log(`📥 Fetching comments for post: ${env.REDDIT_POST_ID}`);
    const comments = await fetchComments(env.REDDIT_POST_ID, accessToken);
    console.log(`Found ${comments.length} valid comments`);

    if (comments.length === 0) {
      console.log('No comments to process');
      return;
    }

    // Process comments and reply
    let repliesPosted = 0;
    const delays = [];

    for (const comment of comments) {
      // Stop if we've hit our limit
      if (repliesPosted >= MAX_REPLIES_PER_RUN) {
        console.log(`Reached maximum replies limit (${MAX_REPLIES_PER_RUN})`);
        break;
      }

      // Skip if we've already replied
      if (await hasReplied(comment.id, env.REPLIED_COMMENTS)) {
        continue;
      }

      // Skip if this is our own comment
      if (comment.author === env.REDDIT_USERNAME) {
        console.log(`Skipping own comment: ${comment.id}`);
        await markAsReplied(comment.id, '[own comment]', env.REPLIED_COMMENTS, KV_TTL_SECONDS);
        continue;
      }

      console.log(`\n💬 Processing comment ${comment.id} by u/${comment.author}`);
      console.log(`Comment: "${comment.body.substring(0, 100)}${comment.body.length > 100 ? '...' : ''}"`);

      try {
        // Generate response using Claude
        console.log('🤔 Generating response with Claude...');
        const response = await generateResponse(comment.body, env.ANTHROPIC_API_KEY);

        if (response === null) {
          console.log('⏭️  Claude decided to skip this comment');
          await markAsReplied(comment.id, '[skipped by Claude]', env.REPLIED_COMMENTS, KV_TTL_SECONDS);
          continue;
        }

        console.log(`✅ Generated response: "${response.substring(0, 100)}${response.length > 100 ? '...' : ''}"`);

        // Calculate random delay for this reply
        const delay = Math.floor(Math.random() * (MAX_DELAY_SECONDS - MIN_DELAY_SECONDS + 1)) + MIN_DELAY_SECONDS;
        delays.push(delay);

        // Schedule the reply with a delay
        console.log(`⏱️  Scheduling reply with ${delay}s delay...`);

        ctx.waitUntil(
          (async () => {
            await sleep(delay * 1000);
            try {
              await postReply(comment.id, response, accessToken, env.REDDIT_USERNAME);
              await markAsReplied(comment.id, response, env.REPLIED_COMMENTS, KV_TTL_SECONDS);
              console.log(`✅ Posted reply to comment ${comment.id}`);
            } catch (error) {
              if (error.message === 'RATE_LIMITED') {
                console.error(`⚠️  Rate limited by Reddit. Stopping for this run.`);
                throw error; // Stop processing more comments
              }
              console.error(`❌ Failed to post reply to ${comment.id}:`, error.message);
            }
          })()
        );

        repliesPosted++;

      } catch (error) {
        console.error(`❌ Error processing comment ${comment.id}:`, error.message);

        // If we hit rate limit, stop processing
        if (error.message === 'RATE_LIMITED') {
          break;
        }
      }
    }

    console.log(`\n📊 Summary: Scheduled ${repliesPosted} replies with delays: ${delays.join(', ')}s`);

  } catch (error) {
    console.error('❌ Cron handler error:', error.message);
    console.error(error.stack);
  }
}

/**
 * Sleep helper function
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
