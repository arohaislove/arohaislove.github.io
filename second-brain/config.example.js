/**
 * Second Brain Configuration
 *
 * SETUP INSTRUCTIONS:
 * 1. Copy this file and rename it to: config.js
 * 2. Replace 'your-auth-token-here' with your actual AUTH_TOKEN
 * 3. NEVER commit config.js to git (it's in .gitignore)
 *
 * To generate a new token, run in terminal:
 *   openssl rand -hex 32
 */

const CONFIG = {
    // Your secret authentication token
    // Keep this private! Do not share or commit to git
    AUTH_TOKEN: 'your-auth-token-here',

    // Worker API endpoint (no need to change this)
    WORKER_URL: 'https://second-brain.zammel.workers.dev'
};

// Make config available globally
window.SECOND_BRAIN_CONFIG = CONFIG;
