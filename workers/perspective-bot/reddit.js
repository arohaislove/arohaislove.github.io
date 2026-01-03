/**
 * Reddit API Integration
 * Handles OAuth, fetching comments, and posting replies
 */

import { REDDIT_API_BASE, REDDIT_TOKEN_URL, USER_AGENT, MAX_COMMENT_AGE_HOURS } from './config.js';

/**
 * Get Reddit OAuth access token
 */
export async function getRedditAccessToken(env) {
  const credentials = btoa(`${env.REDDIT_CLIENT_ID}:${env.REDDIT_CLIENT_SECRET}`);

  const response = await fetch(REDDIT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username: env.REDDIT_USERNAME,
      password: env.REDDIT_PASSWORD
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Reddit OAuth failed: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Fetch comments from a Reddit post
 */
export async function fetchComments(postId, accessToken) {
  const response = await fetch(`${REDDIT_API_BASE}/comments/${postId}?sort=new&limit=50`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'User-Agent': USER_AGENT
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch comments: ${response.status} ${error}`);
  }

  const data = await response.json();

  // Reddit returns an array: [post_data, comments_data]
  // We want the comments data (index 1)
  const commentsListing = data[1];

  if (!commentsListing || !commentsListing.data || !commentsListing.data.children) {
    return [];
  }

  return commentsListing.data.children
    .map(child => child.data)
    .filter(comment => isValidComment(comment));
}

/**
 * Check if a comment is valid for replying
 */
function isValidComment(comment) {
  // Skip if not a comment (could be "more" object)
  if (comment.kind === 'more') {
    return false;
  }

  // Skip deleted/removed comments
  if (comment.author === '[deleted]' || comment.body === '[removed]' || comment.body === '[deleted]') {
    return false;
  }

  // Skip comments older than MAX_COMMENT_AGE_HOURS
  const commentAge = Date.now() / 1000 - comment.created_utc;
  if (commentAge > MAX_COMMENT_AGE_HOURS * 60 * 60) {
    return false;
  }

  // Only top-level comments (has parent that starts with t3_ which is a post)
  if (!comment.parent_id || !comment.parent_id.startsWith('t3_')) {
    return false;
  }

  return true;
}

/**
 * Post a reply to a Reddit comment
 */
export async function postReply(commentId, replyText, accessToken, botUsername) {
  // Double-check we're not replying to ourselves
  const response = await fetch(`${REDDIT_API_BASE}/api/comment`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT
    },
    body: new URLSearchParams({
      thing_id: `t1_${commentId}`,
      text: replyText
    })
  });

  if (!response.ok) {
    const error = await response.text();

    // Check for rate limit error
    if (response.status === 429) {
      throw new Error('RATE_LIMITED');
    }

    throw new Error(`Failed to post reply: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Check if we've already replied to a comment
 */
export async function hasReplied(commentId, kv) {
  const key = `replied:${commentId}`;
  const value = await kv.get(key);
  return value !== null;
}

/**
 * Mark a comment as replied
 */
export async function markAsReplied(commentId, responseText, kv, ttl) {
  const key = `replied:${commentId}`;
  const value = JSON.stringify({
    replied_at: new Date().toISOString(),
    response: responseText
  });

  await kv.put(key, value, { expirationTtl: ttl });
}
