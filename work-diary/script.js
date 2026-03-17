// ─── CONFIG ───────────────────────────────────────────────────────────────────
// After setup, replace YOUR_TOKEN_HERE with your WORK_DIARY_TOKEN secret value.
const CONFIG = {
    WORKER_URL: 'https://work-diary.zammel.workers.dev',
    AUTH_TOKEN: 'YOUR_TOKEN_HERE'
};
// ─────────────────────────────────────────────────────────────────────────────

// Show config warning if token not set
if (CONFIG.AUTH_TOKEN === 'YOUR_TOKEN_HERE') {
    document.getElementById('config-warning').classList.remove('hidden');
}

// Set today's date as default for times tab
document.getElementById('times-date').value = new Date().toISOString().split('T')[0];


// ─── TABS ─────────────────────────────────────────────────────────────────────

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
        tab.classList.add('active');
        document.getElementById('tab-' + target).classList.remove('hidden');
    });
});


// ─── VOICE INPUT ─────────────────────────────────────────────────────────────

function setupVoice(btnId, targetId) {
    const btn = document.getElementById(btnId);
    const target = document.getElementById(targetId);

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        btn.disabled = true;
        btn.title = 'Speech recognition not supported in this browser. Use Chrome.';
        btn.querySelector('.mic-label').textContent = 'No mic';
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-NZ';

    let listening = false;

    btn.addEventListener('click', () => {
        if (listening) {
            recognition.stop();
            return;
        }
        recognition.start();
    });

    recognition.onstart = () => {
        listening = true;
        btn.classList.add('listening');
        btn.querySelector('.mic-label').textContent = 'Listening...';
    };

    recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        // Append to existing text (don't wipe what they typed)
        const existing = target.value.trim();
        target.value = existing ? existing + ' ' + transcript : transcript;
    };

    recognition.onend = () => {
        listening = false;
        btn.classList.remove('listening');
        btn.querySelector('.mic-label').textContent = 'Speak';
    };

    recognition.onerror = (e) => {
        listening = false;
        btn.classList.remove('listening');
        btn.querySelector('.mic-label').textContent = 'Speak';
        console.warn('Speech error:', e.error);
    };
}

setupVoice('diary-voice-btn', 'diary-entry');
setupVoice('times-voice-btn', 'times-activity');


// ─── SUBMIT ───────────────────────────────────────────────────────────────────

function showStatus(id, message, type) {
    const el = document.getElementById(id);
    el.textContent = message;
    el.className = 'status ' + type;
    el.classList.remove('hidden');
    if (type === 'success') {
        setTimeout(() => el.classList.add('hidden'), 4000);
    }
}

async function capture(payload) {
    const response = await fetch(CONFIG.WORKER_URL + '/capture', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + CONFIG.AUTH_TOKEN,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
    return response.json();
}

// Diary submit
document.getElementById('diary-submit').addEventListener('click', async () => {
    const entry = document.getElementById('diary-entry').value.trim();
    if (!entry) return;

    const btn = document.getElementById('diary-submit');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const tags = document.getElementById('diary-tags').value
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

    try {
        const result = await capture({ type: 'diary', entry, tags, source: 'web' });
        if (result.success) {
            showStatus('diary-status', 'Saved to your diary.', 'success');
            document.getElementById('diary-entry').value = '';
            document.getElementById('diary-tags').value = '';
        } else {
            showStatus('diary-status', 'Error: ' + (result.error || 'Something went wrong'), 'error');
        }
    } catch (err) {
        showStatus('diary-status', 'Could not reach worker: ' + err.message, 'error');
    }

    btn.disabled = false;
    btn.textContent = 'Save to Diary';
});

// Times submit
document.getElementById('times-submit').addEventListener('click', async () => {
    const activity = document.getElementById('times-activity').value.trim();
    if (!activity) return;

    const btn = document.getElementById('times-submit');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const payload = {
        type: 'times',
        date: document.getElementById('times-date').value,
        startTime: document.getElementById('times-start').value,
        endTime: document.getElementById('times-end').value,
        activity
    };

    try {
        const result = await capture(payload);
        if (result.success) {
            showStatus('times-status', 'Time logged.', 'success');
            document.getElementById('times-activity').value = '';
            document.getElementById('times-start').value = '';
            document.getElementById('times-end').value = '';
        } else {
            showStatus('times-status', 'Error: ' + (result.error || 'Something went wrong'), 'error');
        }
    } catch (err) {
        showStatus('times-status', 'Could not reach worker: ' + err.message, 'error');
    }

    btn.disabled = false;
    btn.textContent = 'Log Time';
});
