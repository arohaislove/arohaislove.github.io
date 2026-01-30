/**
 * SAR Boat Book Audio Guide
 * Simple: one click to generate, scrubber synced to transcript sections
 */

const WORKER_URL = 'https://vox-api.zammel.workers.dev';

const VOICES = {
    'calm-professional': { voiceId: 'CwhRBWXzGAHq8TQ4Fs17', stability: 0.75, similarity_boost: 0.75 },
    'warm-narrator': { voiceId: 'EXAVITQu4vr4xnSDxMaL', stability: 0.7, similarity_boost: 0.8 },
    'clear-instructor': { voiceId: 'TxGEqnHWrfWFTfGW9XjX', stability: 0.8, similarity_boost: 0.7 }
};

// State
let audio = null;
let sectionTimings = []; // { start, end, el } - populated after generation
let isGenerating = false;

const $ = id => document.getElementById(id);

function init() {
    $('generateBtn').addEventListener('click', generate);
    $('playBtn').addEventListener('click', togglePlay);
    $('downloadBtn').addEventListener('click', download);
    $('scrubber').addEventListener('input', scrub);
}

/** Get text from a transcript section element */
function getSectionText(sectionEl) {
    return Array.from(sectionEl.querySelectorAll('p'))
        .map(p => p.textContent.trim())
        .join(' ');
}

/** Generate audio for all sections, combine, enable player */
async function generate() {
    if (isGenerating) return;
    isGenerating = true;

    const genBtn = $('generateBtn');
    const progressWrap = $('progressWrap');
    const progressBar = $('progressBar');
    const progressText = $('progressText');

    genBtn.disabled = true;
    genBtn.textContent = 'Generating...';
    progressWrap.classList.remove('hidden');

    const sections = document.querySelectorAll('.transcript .section');
    const total = sections.length;
    const blobs = [];

    try {
        for (let i = 0; i < total; i++) {
            const text = getSectionText(sections[i]);
            const pct = Math.round(((i) / total) * 100);
            progressBar.style.width = pct + '%';
            progressText.textContent = `Section ${i + 1} of ${total}...`;

            const blob = await callAPI(text);
            blobs.push(blob);

            // Small delay between calls
            if (i < total - 1) await sleep(400);
        }

        progressBar.style.width = '100%';
        progressText.textContent = 'Combining audio...';

        // Combine all blobs
        const combined = new Blob(blobs, { type: 'audio/mpeg' });
        const url = URL.createObjectURL(combined);

        // Create audio element
        audio = new Audio(url);
        audio.addEventListener('loadedmetadata', () => {
            $('totalTime').textContent = formatTime(audio.duration);
            $('scrubber').disabled = false;
            $('playBtn').disabled = false;
            $('downloadBtn').disabled = false;
        });

        // Calculate section timings based on text length proportion
        // (approximation - ElevenLabs roughly proportional to text length)
        audio.addEventListener('loadedmetadata', () => {
            const totalChars = blobs.reduce((sum, _, i) => sum + getSectionText(sections[i]).length, 0);
            let cumulative = 0;
            sectionTimings = [];

            for (let i = 0; i < total; i++) {
                const chars = getSectionText(sections[i]).length;
                const start = (cumulative / totalChars) * audio.duration;
                cumulative += chars;
                const end = (cumulative / totalChars) * audio.duration;
                sectionTimings.push({ start, end, el: sections[i] });
            }
        });

        // Update scrubber and highlight during playback
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('ended', () => {
            $('playBtn').textContent = 'Play';
        });

        // Store blob for download
        audio._blob = combined;

        progressText.textContent = 'Ready!';
        genBtn.textContent = 'Regenerate';
        setTimeout(() => progressWrap.classList.add('hidden'), 1500);

    } catch (err) {
        console.error(err);
        progressText.textContent = 'Error: ' + err.message;
        genBtn.textContent = 'Generate Audio';
    }

    genBtn.disabled = false;
    isGenerating = false;
}

/** Call ElevenLabs via worker */
async function callAPI(text) {
    const voice = VOICES[$('voiceSelect').value] || VOICES['calm-professional'];

    const res = await fetch(`${WORKER_URL}/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            text,
            voiceSettings: {
                voiceId: voice.voiceId,
                stability: voice.stability,
                similarity_boost: voice.similarity_boost,
                style: 0,
                use_speaker_boost: true
            }
        })
    });

    if (!res.ok) throw new Error('Audio generation failed');
    return await res.blob();
}

/** Toggle play/pause */
function togglePlay() {
    if (!audio) return;
    if (audio.paused) {
        audio.play();
        $('playBtn').textContent = 'Pause';
    } else {
        audio.pause();
        $('playBtn').textContent = 'Play';
    }
}

/** Scrubber input handler */
function scrub() {
    if (!audio) return;
    audio.currentTime = (parseFloat($('scrubber').value) / 100) * audio.duration;
}

/** Update scrubber position and highlight active section */
function onTimeUpdate() {
    if (!audio) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    $('scrubber').value = pct;
    $('currentTime').textContent = formatTime(audio.currentTime);

    // Highlight active section
    for (const timing of sectionTimings) {
        if (audio.currentTime >= timing.start && audio.currentTime < timing.end) {
            if (!timing.el.classList.contains('active')) {
                // Remove active from all, add to current
                sectionTimings.forEach(t => t.el.classList.remove('active'));
                timing.el.classList.add('active');
                // Scroll into view smoothly
                timing.el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
        // Mark played sections
        if (audio.currentTime > timing.end) {
            timing.el.classList.remove('active');
            timing.el.classList.add('played');
        }
    }
}

/** Download the combined audio */
function download() {
    if (!audio || !audio._blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(audio._blob);
    a.download = 'SAR-Boat-Book-Ch1-Crew-Welfare.mp3';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
