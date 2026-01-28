/**
 * SAR Boat Book - Audio Learning Guide
 * One button per chapter: generates all sections, combines, and plays.
 */

const CONFIG = {
    workerUrl: 'https://vox-api.zammel.workers.dev',
    voice: {
        voiceId: 'CwhRBWXzGAHq8TQ4Fs17', // Roger - calm & professional
        stability: 0.75,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true
    },
    chapters: {
        1: [
            'ch1-intro',
            'ch1-imsafe-overview',
            'ch1-imsafe-detail',
            'ch1-fatigue-risk',
            'ch1-fatigue-factors',
            'ch1-fatigue-tips',
            'ch1-hs-basics',
            'ch1-hs-rights',
            'ch1-hs-responsibilities',
            'ch1-vault',
            'ch1-trauma',
            'ch1-support'
        ]
    },
    sectionNames: {
        'ch1-intro': 'Introduction',
        'ch1-imsafe-overview': 'IMSAFE - Your Personal Checklist',
        'ch1-imsafe-detail': 'IMSAFE - The Six Checks',
        'ch1-fatigue-risk': 'Fatigue - The Critical Risk',
        'ch1-fatigue-factors': 'The Seven Fatigue Factors',
        'ch1-fatigue-tips': 'Managing Fatigue - Practical Tips',
        'ch1-hs-basics': 'Health & Safety - Key Definitions',
        'ch1-hs-rights': 'Your Rights Under Health & Safety Law',
        'ch1-hs-responsibilities': 'Your Responsibilities as a Volunteer',
        'ch1-vault': 'VAULT - Reporting Incidents',
        'ch1-trauma': 'Understanding Traumatic Events',
        'ch1-support': 'Support Services & Conclusion'
    }
};

// State
const state = {
    audioCache: {},      // sectionId -> blob (persists across plays)
    isGenerating: false
};

// DOM refs
const statusEl = document.getElementById('status');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

function init() {
    document.querySelectorAll('.btn-play-chapter').forEach(btn => {
        btn.addEventListener('click', () => playChapter(btn.dataset.chapter));
    });
}

/**
 * Play an entire chapter: generate any missing audio, combine, and play
 */
async function playChapter(chapterNum) {
    if (state.isGenerating) return;

    const sections = CONFIG.chapters[chapterNum];
    if (!sections) return;

    const btn = document.getElementById(`playChapter${chapterNum}`);
    const playerDiv = document.getElementById(`player${chapterNum}`);
    const audioEl = document.getElementById(`audio${chapterNum}`);
    const nowPlaying = document.getElementById(`nowPlaying${chapterNum}`);

    // Check if we already have all audio cached
    const allCached = sections.every(id => state.audioCache[id]);

    if (allCached) {
        // Already generated - just combine and play
        const combined = combineBlobs(sections);
        audioEl.src = URL.createObjectURL(combined);
        playerDiv.classList.remove('hidden');
        nowPlaying.textContent = 'Playing Chapter ' + chapterNum;
        audioEl.play();
        return;
    }

    // Need to generate
    state.isGenerating = true;
    btn.querySelector('.play-icon').textContent = '⏳';
    btn.querySelector('.play-label').textContent = 'Generating...';
    btn.disabled = true;

    showStatus('Generating audio...', 'info');
    showProgress(0);

    try {
        for (let i = 0; i < sections.length; i++) {
            const sectionId = sections[i];
            const sectionName = CONFIG.sectionNames[sectionId] || sectionId;

            if (!state.audioCache[sectionId]) {
                showStatus(`Generating: ${sectionName} (${i + 1}/${sections.length})`, 'info');
                const text = getSectionText(sectionId);
                const blob = await callAPI(text);
                state.audioCache[sectionId] = blob;
            }

            showProgress(((i + 1) / sections.length) * 100);
        }

        // Combine and play
        const combined = combineBlobs(sections);
        audioEl.src = URL.createObjectURL(combined);
        playerDiv.classList.remove('hidden');
        nowPlaying.textContent = 'Playing Chapter ' + chapterNum;
        audioEl.play();

        showStatus('Playing Chapter ' + chapterNum, 'success');
        setTimeout(hideStatus, 3000);

    } catch (err) {
        console.error('Error:', err);
        showStatus('Error generating audio. Please try again.', 'error');
    } finally {
        state.isGenerating = false;
        hideProgress();
        btn.querySelector('.play-icon').textContent = '▶';
        btn.querySelector('.play-label').textContent = 'Play Chapter';
        btn.disabled = false;
    }
}

/**
 * Get script text for a section from the hidden content divs
 */
function getSectionText(sectionId) {
    const div = document.querySelector(`#chapter-scripts [data-section="${sectionId}"]`);
    if (!div) return '';
    const paragraphs = div.querySelectorAll('p');
    return Array.from(paragraphs).map(p => p.textContent.trim()).join(' ');
}

/**
 * Combine multiple audio blobs into one
 */
function combineBlobs(sectionIds) {
    const blobs = sectionIds
        .map(id => state.audioCache[id])
        .filter(Boolean);
    return new Blob(blobs, { type: 'audio/mpeg' });
}

/**
 * Call ElevenLabs API via worker
 */
async function callAPI(text) {
    const response = await fetch(`${CONFIG.workerUrl}/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            text: text,
            voiceSettings: {
                voiceId: CONFIG.voice.voiceId,
                stability: CONFIG.voice.stability,
                similarity_boost: CONFIG.voice.similarity_boost,
                style: CONFIG.voice.style,
                use_speaker_boost: CONFIG.voice.use_speaker_boost
            }
        })
    });

    if (!response.ok) {
        throw new Error('Audio generation failed');
    }

    return await response.blob();
}

// UI helpers
function showStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = `status ${type}`;
    statusEl.classList.remove('hidden');
}

function hideStatus() {
    statusEl.classList.add('hidden');
}

function showProgress(pct) {
    progressContainer.classList.remove('hidden');
    progressBar.style.width = `${pct}%`;
    progressText.textContent = `${Math.round(pct)}%`;
}

function hideProgress() {
    progressContainer.classList.add('hidden');
}

// Init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
