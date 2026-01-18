// Configuration - Configured and ready to use
const CONFIG = {
    WORKER_URL: 'https://second-brain.zammel.workers.dev',
    AUTH_TOKEN: 'd4226dc2dd7bff69c4272abdbe43ee3984bcee798dd3e9629f3973fd3e230027'
};

// Elements
const input = document.getElementById('input');
const micBtn = document.getElementById('micBtn');
const cameraBtn = document.getElementById('cameraBtn');
const photoInput = document.getElementById('photoInput');
const photoPreview = document.getElementById('photoPreview');
const photoImg = document.getElementById('photoImg');
const removePhotoBtn = document.getElementById('removePhotoBtn');
const sendBtn = document.getElementById('sendBtn');
const status = document.getElementById('status');
const recentSection = document.getElementById('recentSection');
const recentItems = document.getElementById('recentItems');
const workerUrlEl = document.getElementById('workerUrl');

workerUrlEl.textContent = CONFIG.WORKER_URL;
workerUrlEl.href = CONFIG.WORKER_URL + '/health';

// Photo state
let currentPhoto = null; // Stores base64 image data

// Speech recognition
let recognition = null;
let isListening = false;
let autoSendTimer = null;
let typingTimer = null;
const AUTO_SEND_DELAY = 4000; // Wait 4 seconds of silence before auto-sending (voice)
const TYPING_AUTO_SEND_DELAY = 5000; // Wait 5 seconds after typing stops

// Audio level monitoring for better silence detection
let audioContext = null;
let mediaStream = null;
let analyser = null;
let silenceStart = null;
let volumeCheckInterval = null;
const SILENCE_THRESHOLD = 0.01; // Audio level threshold to detect silence
const SILENCE_DURATION = 4000; // 4 seconds of silence before auto-send

// Helper to clear typing timer
function clearTypingTimer() {
    if (typingTimer) {
        clearTimeout(typingTimer);
        if (typingTimer.countdownInterval) {
            clearInterval(typingTimer.countdownInterval);
        }
        typingTimer = null;
        hideStatus();
    }
}

// Audio level monitoring helpers
async function startAudioMonitoring() {
    try {
        // Get microphone access
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Create audio context and analyser
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;

        const source = audioContext.createMediaStreamSource(mediaStream);
        source.connect(analyser);

        // Start monitoring volume levels
        silenceStart = Date.now();
        volumeCheckInterval = setInterval(checkAudioLevel, 100);

    } catch (error) {
        console.error('Failed to start audio monitoring:', error);
    }
}

function checkAudioLevel() {
    if (!analyser || !isListening) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteTimeDomainData(dataArray);

    // Calculate RMS (root mean square) of audio signal
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / bufferLength);

    // Check if audio level indicates speech or silence
    if (rms > SILENCE_THRESHOLD) {
        // Sound detected - reset silence timer
        silenceStart = Date.now();

        // Clear any pending auto-send
        if (autoSendTimer) {
            clearTimeout(autoSendTimer);
            autoSendTimer = null;
        }

        showStatus('Listening... 🎤', 'info');
    } else {
        // Silence detected - check duration
        const silenceDuration = Date.now() - silenceStart;

        if (silenceDuration >= SILENCE_DURATION && input.value.trim()) {
            // 4 seconds of silence and we have text - auto send
            if (!autoSendTimer) {
                showStatus('Detected silence - sending...', 'info');
                autoSendTimer = setTimeout(() => {
                    if (isListening && input.value.trim()) {
                        stopAudioMonitoring();
                        recognition.stop();
                        sendCapture();
                    }
                }, 200); // Small delay to avoid race conditions
            }
        } else if (silenceDuration >= 2000) {
            // Show countdown after 2 seconds of silence
            const secondsLeft = Math.ceil((SILENCE_DURATION - silenceDuration) / 1000);
            if (input.value.trim()) {
                showStatus(`Listening... (${secondsLeft}s until auto-send)`, 'info');
            }
        }
    }
}

function stopAudioMonitoring() {
    if (volumeCheckInterval) {
        clearInterval(volumeCheckInterval);
        volumeCheckInterval = null;
    }

    if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
        audioContext = null;
    }

    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }

    analyser = null;
    silenceStart = null;
}

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep listening through pauses
    recognition.interimResults = true;
    recognition.lang = 'en-NZ';

    recognition.onstart = () => {
        isListening = true;
        micBtn.classList.add('listening');
        micBtn.textContent = '🔴 Listening...';
        clearTypingTimer(); // Clear any pending typing auto-send
        showStatus('Listening... 🎤', 'info');

        // Start audio level monitoring for better silence detection
        startAudioMonitoring();
    };

    recognition.onend = () => {
        isListening = false;
        micBtn.classList.remove('listening');
        micBtn.textContent = '🎤 Speak';
        hideStatus();

        // Stop audio monitoring
        stopAudioMonitoring();

        // Clear any pending auto-send when stopping
        if (autoSendTimer) {
            clearTimeout(autoSendTimer);
            autoSendTimer = null;
        }
    };

    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        input.value = transcript;

        // Audio level monitoring handles silence detection
        // This handler just updates the transcript
        // Reset silence timer since we got new speech results
        if (silenceStart) {
            silenceStart = Date.now();
        }
    };

    recognition.onerror = (event) => {
        console.error('Speech error:', event.error);

        // Stop audio monitoring
        stopAudioMonitoring();

        // Ignore 'no-speech' and 'aborted' errors (these are normal)
        if (event.error === 'no-speech' || event.error === 'aborted') {
            return;
        }

        showStatus('Speech error: ' + event.error, 'error');
        isListening = false;
        micBtn.classList.remove('listening');
        micBtn.textContent = '🎤 Speak';

        if (autoSendTimer) {
            clearTimeout(autoSendTimer);
            autoSendTimer = null;
        }
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
        clearTypingTimer(); // Clear any pending typing auto-send
        input.value = '';
        recognition.start();
    }
});

sendBtn.addEventListener('click', sendCapture);

// Photo capture
cameraBtn.addEventListener('click', () => {
    photoInput.click();
});

photoInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showStatus('Photo too large (max 5MB)', 'error');
        return;
    }

    // Show loading state
    showStatus('Processing photo...', 'info');
    cameraBtn.disabled = true;

    try {
        // Convert to base64
        const base64 = await fileToBase64(file);

        // Store photo data
        currentPhoto = base64;

        // Show preview
        photoImg.src = base64;
        photoPreview.style.display = 'block';

        showStatus('Photo added! Add notes or send as-is', 'success');
    } catch (error) {
        console.error('Photo error:', error);
        showStatus('Failed to process photo', 'error');
    } finally {
        cameraBtn.disabled = false;
        photoInput.value = ''; // Reset input
    }
});

removePhotoBtn.addEventListener('click', () => {
    clearPhoto();
    showStatus('Photo removed', 'info');
});

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        clearTypingTimer();
        sendCapture();
    }
});

// Auto-send after typing pause
input.addEventListener('input', () => {
    // Clear any existing typing timer
    clearTypingTimer();

    // Don't start timer if listening to speech
    if (isListening) return;

    const text = input.value.trim();
    if (!text) return;

    // Start countdown in status
    let secondsLeft = Math.ceil(TYPING_AUTO_SEND_DELAY / 1000);
    showStatus(`Will auto-send in ${secondsLeft}s... (keep typing to cancel)`, 'info');

    // Update countdown every second
    let countdownInterval = setInterval(() => {
        secondsLeft--;
        if (secondsLeft > 0) {
            showStatus(`Will auto-send in ${secondsLeft}s... (keep typing to cancel)`, 'info');
        }
    }, 1000);

    // Set timer to auto-send
    typingTimer = setTimeout(() => {
        clearInterval(countdownInterval);
        if (input.value.trim() && !isListening) {
            sendCapture();
        }
    }, TYPING_AUTO_SEND_DELAY);

    // Store interval ID so we can clear it
    typingTimer.countdownInterval = countdownInterval;
});

// Send capture to worker
async function sendCapture() {
    const text = input.value.trim();
    const hasPhoto = !!currentPhoto;

    // Need either text or photo
    if (!text && !hasPhoto) {
        showStatus('Add some text or a photo', 'error');
        return;
    }

    // Clear any pending timers
    clearTypingTimer();

    if (CONFIG.AUTH_TOKEN === 'YOUR_AUTH_TOKEN_HERE') {
        showStatus('⚠️ Please configure AUTH_TOKEN in script.js', 'error');
        return;
    }

    sendBtn.disabled = true;
    showStatus('Processing...', 'info');

    try {
        const payload = {
            input: text || '(photo)',
            source: 'web'
        };

        // Add photo if present
        if (currentPhoto) {
            payload.image = currentPhoto;
        }

        const response = await fetch(CONFIG.WORKER_URL + '/capture', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.AUTH_TOKEN}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showStatus(`✓ Captured as ${data.item.type}`, 'success');
            input.value = '';
            clearPhoto();
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
            recentItems.innerHTML = data.items.map(item => {
                const photoThumbnail = item.image
                    ? `<img src="${item.image}" style="max-width: 60px; max-height: 60px; border-radius: 4px; margin-right: 8px; object-fit: cover; vertical-align: middle;">`
                    : '';
                return `
                    <div class="recent-item">
                        <span class="type-badge type-${item.type}">${item.type}</span>
                        ${photoThumbnail}
                        ${escapeHtml(item.input.substring(0, 100))}${item.input.length > 100 ? '...' : ''}
                    </div>
                `;
            }).join('');
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

// Photo helpers
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function clearPhoto() {
    currentPhoto = null;
    photoPreview.style.display = 'none';
    photoImg.src = '';
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
