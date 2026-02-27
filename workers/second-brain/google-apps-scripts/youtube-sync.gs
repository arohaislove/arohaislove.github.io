/**
 * YouTube Sync for Second Brain
 *
 * Syncs your YouTube liked videos and your own uploads to the Second Brain worker.
 * Runs as YOU via Google Apps Script — no OAuth credentials needed in the worker.
 *
 * SETUP (one-time, ~10 minutes, works on mobile via script.google.com):
 * 1. Go to https://script.google.com and sign in
 * 2. Option A: Add to existing project (open gmail-sync project, create new file)
 *    Option B: Create a new project for YouTube
 * 3. Paste this entire file into a new script file
 * 4. Enable the YouTube Data API advanced service:
 *    - In the editor, click the "+" next to "Services" in the left sidebar
 *    - Find "YouTube Data API v3" → select it → click "Add"
 * 5. Set AUTH_TOKEN script property (skip if already done for Gmail sync):
 *    - Click the gear icon (⚙️) → "Project settings"
 *    - Scroll to "Script properties" → "Add script property"
 *    - Key: AUTH_TOKEN  Value: your-second-brain-auth-token
 * 6. Run the sync once manually to grant permissions:
 *    - Select "syncYoutube" from the function dropdown
 *    - Click ▶ Run
 *    - Click through the permission dialogs
 * 7. Set up a time trigger for ongoing capture:
 *    - Click the clock icon (⏰) → "Add Trigger"
 *    - Function: syncYoutube
 *    - Event source: Time-driven
 *    - Type: Day timer (YouTube doesn't change as fast as email)
 *    - Interval: Every day (e.g. between 6am–7am)
 *    - Save
 *
 * NOTE: Liked videos are private by default on YouTube, which is why this needs
 * to run as you (authenticated) rather than as a public API call.
 *
 * WORKER URL: Update WORKER_URL below if you change the worker name.
 */

const WORKER_URL = 'https://second-brain.zammel.workers.dev';

/**
 * Main sync function — run on a daily trigger.
 * Syncs liked videos and your uploads. Duplicates are ignored by the worker.
 */
function syncYoutube() {
  const props = PropertiesService.getScriptProperties();
  const authToken = props.getProperty('AUTH_TOKEN');
  if (!authToken) {
    console.error('AUTH_TOKEN not set in Script Properties. See setup instructions.');
    return;
  }

  let totalIngested = 0;
  let totalSkipped = 0;

  // Sync liked videos
  const likedResult = syncLikedVideos(authToken);
  totalIngested += likedResult.ingested;
  totalSkipped += likedResult.skipped;

  // Sync user's own uploads
  const uploadsResult = syncUploads(authToken);
  totalIngested += uploadsResult.ingested;
  totalSkipped += uploadsResult.skipped;

  console.log('YouTube sync complete — ingested: ' + totalIngested + ', skipped (duplicate): ' + totalSkipped);
}

/**
 * Sync videos you've liked on YouTube
 */
function syncLikedVideos(authToken) {
  let ingested = 0;
  let skipped = 0;

  try {
    const response = YouTube.Videos.list('snippet', {
      myRating: 'like',
      maxResults: 50
    });

    for (const video of (response.items || [])) {
      const result = postToWorker(WORKER_URL + '/ingest-youtube', {
        videoId: video.id,
        title: video.snippet.title || '',
        channelTitle: video.snippet.channelTitle || '',
        captureType: 'liked',
        publishedAt: video.snippet.publishedAt || null,
        url: 'https://www.youtube.com/watch?v=' + video.id,
        description: (video.snippet.description || '').substring(0, 500)
      }, authToken);

      if (result) {
        result.duplicate ? skipped++ : ingested++;
      }

      Utilities.sleep(100);
    }

  } catch (e) {
    console.error('Error syncing liked videos:', e.message);
  }

  return { ingested, skipped };
}

/**
 * Sync your own YouTube uploads
 */
function syncUploads(authToken) {
  let ingested = 0;
  let skipped = 0;

  try {
    // Get the uploads playlist ID for the authenticated user
    const channels = YouTube.Channels.list('contentDetails', { mine: true });
    const uploadsPlaylistId = channels.items &&
      channels.items[0] &&
      channels.items[0].contentDetails &&
      channels.items[0].contentDetails.relatedPlaylists &&
      channels.items[0].contentDetails.relatedPlaylists.uploads;

    if (!uploadsPlaylistId) {
      console.log('No uploads playlist found (you may not have any uploads)');
      return { ingested: 0, skipped: 0 };
    }

    const uploads = YouTube.PlaylistItems.list('snippet', {
      playlistId: uploadsPlaylistId,
      maxResults: 50
    });

    for (const item of (uploads.items || [])) {
      const snippet = item.snippet || {};
      const videoId = snippet.resourceId && snippet.resourceId.videoId;
      if (!videoId) continue;

      const result = postToWorker(WORKER_URL + '/ingest-youtube', {
        videoId: videoId,
        title: snippet.title || '',
        channelTitle: snippet.channelTitle || '',
        captureType: 'upload',
        publishedAt: snippet.publishedAt || null,
        url: 'https://www.youtube.com/watch?v=' + videoId,
        description: (snippet.description || '').substring(0, 500)
      }, authToken);

      if (result) {
        result.duplicate ? skipped++ : ingested++;
      }

      Utilities.sleep(100);
    }

  } catch (e) {
    console.error('Error syncing uploads:', e.message);
  }

  return { ingested, skipped };
}

/**
 * POST data to the Second Brain worker and return the parsed response.
 * Returns null on network/parse error.
 */
function postToWorker(url, data, authToken) {
  try {
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + authToken
      },
      payload: JSON.stringify(data),
      muteHttpExceptions: true
    });

    const code = response.getResponseCode();
    if (code === 200) {
      return JSON.parse(response.getContentText());
    } else {
      console.error('HTTP ' + code + ' posting to ' + url + ': ' + response.getContentText());
    }
  } catch (e) {
    console.error('Error posting to worker:', e.message);
  }
  return null;
}
