/**
 * Gmail Sync for Second Brain
 *
 * Reads your Gmail (sent + received) and POSTs each message to the Second Brain worker.
 * Runs as YOU, so no OAuth credentials needed — Google Apps Script handles auth automatically.
 *
 * SETUP (one-time, ~5 minutes, works on mobile via script.google.com):
 * 1. Go to https://script.google.com and sign in with your Google account
 * 2. Click "New project" (top left)
 * 3. Paste this entire file into the editor, replacing the default code
 * 4. Click the floppy disk icon to save (name it "Second Brain Gmail Sync" or similar)
 * 5. Add your AUTH_TOKEN as a script property:
 *    - Click the gear icon (⚙️) → "Project settings"
 *    - Scroll to "Script properties" → "Add script property"
 *    - Key: AUTH_TOKEN  Value: your-second-brain-auth-token
 * 6. Run the sync once manually to grant permissions:
 *    - Select "syncGmail" from the function dropdown (top bar)
 *    - Click ▶ Run
 *    - Click through the permission dialogs (it will ask to access Gmail)
 * 7. Set up a time trigger for ongoing capture:
 *    - Click the clock icon (⏰) in the left sidebar → "Add Trigger"
 *    - Function: syncGmail
 *    - Event source: Time-driven
 *    - Type: Hour timer
 *    - Interval: Every hour (or every 2 hours)
 *    - Save
 * 8. For a historical batch import of older emails, run historicalSync() once manually:
 *    - Select "historicalSync" from the function dropdown
 *    - Click ▶ Run
 *    - Default: last 30 days. Edit the call below to change (e.g. historicalSync(90) for 90 days)
 *
 * WORKER URL: Update WORKER_URL below if you change the worker name.
 */

const WORKER_URL = 'https://second-brain.zammel.workers.dev';

/**
 * Main sync function — call this on a time trigger (every hour recommended)
 * Only fetches emails since the last sync, so it won't re-import old emails.
 */
function syncGmail() {
  const props = PropertiesService.getScriptProperties();
  const authToken = props.getProperty('AUTH_TOKEN');
  if (!authToken) {
    console.error('AUTH_TOKEN not set in Script Properties. See setup instructions.');
    return;
  }

  // Track last sync time so we only fetch new emails
  const lastSync = props.getProperty('GMAIL_LAST_SYNC');
  const cutoffDate = lastSync
    ? new Date(lastSync)
    : (() => {
        const d = new Date();
        d.setDate(d.getDate() - 1); // First run: go back 1 day
        return d;
      })();

  const searchQuery = 'after:' + formatDateForGmail(cutoffDate);
  let threads;

  try {
    threads = GmailApp.search(searchQuery, 0, 100);
  } catch (e) {
    console.error('Gmail search failed:', e.message);
    return;
  }

  const myEmail = Session.getEffectiveUser().getEmail();
  let ingested = 0;
  let skipped = 0;
  let errors = 0;

  for (const thread of threads) {
    const messages = thread.getMessages();
    for (const msg of messages) {
      if (msg.getDate() < cutoffDate) continue;

      try {
        const from = msg.getFrom();
        const to = msg.getTo();
        const isOutgoing = from.toLowerCase().includes(myEmail.toLowerCase());

        const payload = {
          messageId: msg.getId(),
          subject: msg.getSubject() || '(no subject)',
          from: from,
          to: to,
          date: msg.getDate().toISOString(),
          snippet: msg.getPlainBody().substring(0, 500),
          direction: isOutgoing ? 'outgoing' : 'incoming',
          labels: msg.getLabels().map(l => l.getName())
        };

        const response = UrlFetchApp.fetch(WORKER_URL + '/ingest-email', {
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
          },
          payload: JSON.stringify(payload),
          muteHttpExceptions: true
        });

        const code = response.getResponseCode();
        if (code === 200) {
          const result = JSON.parse(response.getContentText());
          result.duplicate ? skipped++ : ingested++;
        } else {
          console.error('HTTP ' + code + ' for message ' + msg.getId() + ': ' + response.getContentText());
          errors++;
        }

      } catch (e) {
        console.error('Error processing message:', e.message);
        errors++;
      }

      Utilities.sleep(150); // Gentle rate limiting
    }
  }

  // Update last sync timestamp
  props.setProperty('GMAIL_LAST_SYNC', new Date().toISOString());

  console.log('Gmail sync complete — ingested: ' + ingested + ', skipped (duplicate): ' + skipped + ', errors: ' + errors);
}

/**
 * Historical batch import — run this ONCE manually to backfill older emails.
 * After it completes, syncGmail() on a schedule handles everything going forward.
 *
 * @param {number} daysBack - How many days to look back (default: 30)
 */
function historicalSync(daysBack) {
  daysBack = daysBack || 30;
  const props = PropertiesService.getScriptProperties();

  // Temporarily set last sync to daysBack ago so syncGmail fetches that range
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysBack);
  props.setProperty('GMAIL_LAST_SYNC', cutoff.toISOString());

  console.log('Starting historical sync for last ' + daysBack + ' days...');
  syncGmail();
  console.log('Historical sync complete. Regular sync will now run from today onwards.');
}

/**
 * Format a Date for Gmail's after: search operator (YYYY/MM/DD)
 */
function formatDateForGmail(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return y + '/' + m + '/' + d;
}
