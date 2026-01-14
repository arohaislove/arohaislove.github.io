// Configuration - UPDATE THESE AFTER DEPLOYMENT
const CONFIG = {
    WORKER_URL: 'https://second-brain.zammel.workers.dev',
    AUTH_TOKEN: 'YOUR_AUTH_TOKEN_HERE' // Get this from your GitHub secrets or generate a secure random string
};

// Elements
const input = document.getElementById('input');
const micBtn = document.getElementById('micBtn');
const sendBtn = document.getElementById('sendBtn');
const status = document.getElementById('status');
const recentSection = document.getElementById('recentSection');
const recentItems = document.getElementById('recentItems');
const workerUrlEl = document.getElementById('workerUrl');

workerUrlEl.textContent = CONFIG.WORKER_URL;
workerUrlEl.href = CONFIG.WORKER_URL + '/health';

// Speech recognition
let recognition = null;
let isListening = false;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-NZ';

    recognition.onstart = () => {
        isListening = true;
        micBtn.classList.add('listening');
        micBtn.textContent = '🔴 Listening...';
        showStatus('Listening...', 'info');
    };

    recognition.onend = () => {
        isListening = false;
        micBtn.classList.remove('listening');
        micBtn.textContent = '🎤 Speak';
        hideStatus();
    };

    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        input.value = transcript;

        // Auto-send on final result
        if (event.results[event.results.length - 1].isFinal) {
            setTimeout(() => sendCapture(), 500);
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech error:', event.error);
        showStatus('Speech error: ' + event.error, 'error');
        isListening = false;
        micBtn.classList.remove('listening');
        micBtn.textContent = '🎤 Speak';
    };
} else {
    micBtn.textContent = '🎤 Not supported';
    micBtn.disabled = true;
}

// Event listeners
micBtn.addEventListener('click', () => {
    if (!recognition) return;

    if (isListening) {
        recognition.stop();
    } else {
        input.value = '';
        recognition.start();
    }
});

sendBtn.addEventListener('click', sendCapture);

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendCapture();
    }
});

// Send capture to worker
async function sendCapture() {
    const text = input.value.trim();
    if (!text) return;

    if (CONFIG.AUTH_TOKEN === 'YOUR_AUTH_TOKEN_HERE') {
        showStatus('⚠️ Please configure AUTH_TOKEN in script.js', 'error');
        return;
    }

    sendBtn.disabled = true;
    showStatus('Processing...', 'info');

    try {
        const response = await fetch(CONFIG.WORKER_URL + '/capture', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`
            },
            body: JSON.stringify({
                input: text,
                source: 'web'
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showStatus(`✓ Captured as ${data.item.type}`, 'success');
            input.value = '';
            loadRecent();

            // Haptic feedback if available
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        } else {
            showStatus('Error: ' + (data.error || data.message || 'Unknown'), 'error');
        }
    } catch (error) {
        console.error('Capture error:', error);
        showStatus('Failed to connect to worker', 'error');
    }

    sendBtn.disabled = false;
}

// Load recent items
async function loadRecent() {
    if (CONFIG.AUTH_TOKEN === 'YOUR_AUTH_TOKEN_HERE') {
        return; // Don't try to load if not configured
    }

    try {
        const response = await fetch(CONFIG.WORKER_URL + '/items?limit=5', {
            headers: {
                'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`
            }
        });

        if (!response.ok) {
            console.error('Failed to load recent items:', response.status);
            return;
        }

        const data = await response.json();

        if (data.items && data.items.length > 0) {
            recentSection.style.display = 'block';
            recentItems.innerHTML = data.items.map(item => `
                <div class="recent-item">
                    <span class="type-badge type-${item.type}">${item.type}</span>
                    ${escapeHtml(item.input.substring(0, 100))}${item.input.length > 100 ? '...' : ''}
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load recent:', error);
    }
}

// Status helpers
function showStatus(message, type) {
    status.textContent = message;
    status.className = 'status show ' + type;
}

function hideStatus() {
    status.className = 'status';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Check configuration on load
function checkConfiguration() {
    if (CONFIG.AUTH_TOKEN === 'YOUR_AUTH_TOKEN_HERE') {
        showStatus('⚠️ Configuration needed - see script.js', 'error');
        return false;
    }
    return true;
}

// Initialize
if (checkConfiguration()) {
    loadRecent();
}

// Register service worker for PWA support (if available)
if ('serviceWorker' in navigator) {
    // Optional: register service worker for offline support
    // navigator.serviceWorker.register('/second-brain/sw.js');
}
