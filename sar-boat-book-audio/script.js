/**
 * SAR Boat Book - Static Audio Playback
 * No API calls. Pre-generated MP3 files in /audio/ folder.
 * One play button, scrub bar, section highlighting.
 */

const AUDIO_FILES = [
    'audio/ch1-01-introduction.mp3',
    'audio/ch1-02-imsafe-overview.mp3',
    'audio/ch1-03-imsafe-detail.mp3',
    'audio/ch1-04-fatigue-risk.mp3',
    'audio/ch1-05-fatigue-factors.mp3',
    'audio/ch1-06-fatigue-tips.mp3',
    'audio/ch1-07-hs-basics.mp3',
    'audio/ch1-08-hs-rights.mp3',
    'audio/ch1-09-hs-responsibilities.mp3',
    'audio/ch1-10-vault.mp3',
    'audio/ch1-11-trauma.mp3',
    'audio/ch1-12-support.mp3'
];

let audio = null;
let sectionDurations = [];  // cumulative end times
let totalDuration = 0;
let isLoaded = false;
let currentSectionIndex = -1;

const playBtn = document.getElementById('playBtn');
const playIcon = document.getElementById('playIcon');
const scrubber = document.getElementById('scrubber');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const sectionItems = document.querySelectorAll('.section-item');

/**
 * On first play, fetch all MP3s, combine into one audio blob,
 * and track section boundaries for highlighting.
 */
async function loadAudio() {
    if (isLoaded) return;

    playIcon.textContent = '...';
    playBtn.disabled = true;

    try {
        const blobs = [];
        const durations = [];

        for (const file of AUDIO_FILES) {
            const resp = await fetch(file);
            if (!resp.ok) throw new Error(`Failed to load ${file}`);
            const blob = await resp.blob();
            blobs.push(blob);

            // Get duration by loading into temporary audio element
            const dur = await getAudioDuration(blob);
            durations.push(dur);
        }

        // Build cumulative timestamps
        let cumulative = 0;
        sectionDurations = durations.map(d => {
            cumulative += d;
            return cumulative;
        });
        totalDuration = cumulative;

        // Combine all blobs
        const combined = new Blob(blobs, { type: 'audio/mpeg' });
        const url = URL.createObjectURL(combined);

        audio = new Audio(url);
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('loadedmetadata', () => {
            // Use actual duration if available (more accurate)
            if (audio.duration && isFinite(audio.duration)) {
                totalDuration = audio.duration;
            }
            totalTimeEl.textContent = formatTime(totalDuration);
        });

        totalTimeEl.textContent = formatTime(totalDuration);
        isLoaded = true;

    } catch (err) {
        console.error('Error loading audio:', err);
        playIcon.textContent = '!';
        return;
    }

    playBtn.disabled = false;
    playIcon.textContent = '▶';
}

/**
 * Get duration of an audio blob
 */
function getAudioDuration(blob) {
    return new Promise((resolve) => {
        const a = new Audio();
        a.addEventListener('loadedmetadata', () => {
            if (a.duration && isFinite(a.duration)) {
                resolve(a.duration);
            } else {
                // Fallback: estimate ~150 words/min, ~0.4s per word
                resolve(30); // rough fallback
            }
            URL.revokeObjectURL(a.src);
        });
        a.addEventListener('error', () => resolve(30));
        a.src = URL.createObjectURL(blob);
    });
}

/**
 * Play/pause toggle
 */
function togglePlay() {
    if (!isLoaded) {
        loadAudio().then(() => {
            if (isLoaded) {
                audio.play();
                playIcon.textContent = '⏸';
            }
        });
        return;
    }

    if (audio.paused) {
        audio.play();
        playIcon.textContent = '⏸';
    } else {
        audio.pause();
        playIcon.textContent = '▶';
    }
}

/**
 * Update scrubber and section highlighting during playback
 */
function onTimeUpdate() {
    if (!audio || !totalDuration) return;

    const t = audio.currentTime;
    const pct = (t / totalDuration) * 100;
    scrubber.value = pct;
    currentTimeEl.textContent = formatTime(t);

    // Highlight current section
    let idx = 0;
    for (let i = 0; i < sectionDurations.length; i++) {
        if (t < sectionDurations[i]) {
            idx = i;
            break;
        }
        if (i === sectionDurations.length - 1) idx = i;
    }

    if (idx !== currentSectionIndex) {
        currentSectionIndex = idx;
        sectionItems.forEach((el, i) => {
            el.classList.toggle('active', i === idx);
        });
    }
}

/**
 * When audio ends
 */
function onEnded() {
    playIcon.textContent = '▶';
    scrubber.value = 0;
    currentTimeEl.textContent = '0:00';
    currentSectionIndex = -1;
    sectionItems.forEach(el => el.classList.remove('active'));
}

/**
 * Scrubber interaction
 */
function onScrub() {
    if (!audio || !totalDuration) return;
    const pct = parseFloat(scrubber.value);
    audio.currentTime = (pct / 100) * totalDuration;
}

/**
 * Click a section to jump to it
 */
function jumpToSection(index) {
    if (!audio || !isLoaded) {
        loadAudio().then(() => {
            if (isLoaded) jumpToSection(index);
        });
        return;
    }

    const startTime = index === 0 ? 0 : sectionDurations[index - 1];
    audio.currentTime = startTime;
    if (audio.paused) {
        audio.play();
        playIcon.textContent = '⏸';
    }
}

/**
 * Format seconds as M:SS
 */
function formatTime(s) {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Event listeners
playBtn.addEventListener('click', togglePlay);
scrubber.addEventListener('input', onScrub);

sectionItems.forEach(item => {
    item.addEventListener('click', () => {
        jumpToSection(parseInt(item.dataset.index));
    });
});

// Pre-load audio on page load so first play is fast
loadAudio();
