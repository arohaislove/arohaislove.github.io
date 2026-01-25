/**
 * SAR Crew Welfare - Audio Learning Guide Generator
 * Uses ElevenLabs via vox-api worker to generate professional narration
 */

const CONFIG = {
    workerUrl: 'https://vox-api.zammel.workers.dev',
    // Voice configurations for different narrator styles
    voices: {
        'calm-professional': {
            // Using a calm, clear voice - Roger is professional and smooth
            voiceId: 'CwhRBWXzGAHq8TQ4Fs17',
            stability: 0.75,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
        },
        'warm-narrator': {
            // Bella - warm and storytelling style
            voiceId: 'EXAVITQu4vr4xnSDxMaL',
            stability: 0.7,
            similarity_boost: 0.8,
            style: 0.1,
            use_speaker_boost: true
        },
        'clear-instructor': {
            // Josh - clear and authoritative
            voiceId: 'TxGEqnHWrfWFTfGW9XjX',
            stability: 0.8,
            similarity_boost: 0.7,
            style: 0.0,
            use_speaker_boost: true
        }
    }
};

// State
const state = {
    generatedAudio: {},  // section -> blob
    isGenerating: false,
    currentVoice: 'calm-professional'
};

// DOM elements
const elements = {
    generateAllBtn: document.getElementById('generateAllBtn'),
    downloadAllBtn: document.getElementById('downloadAllBtn'),
    voiceSelect: document.getElementById('voiceSelect'),
    status: document.getElementById('status'),
    progressContainer: document.getElementById('progressContainer'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    combinedPlayer: document.getElementById('combinedPlayer'),
    fullAudio: document.getElementById('fullAudio'),
    sections: document.querySelectorAll('.script-section')
};

/**
 * Initialize the application
 */
function init() {
    setupEventListeners();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Voice selection
    elements.voiceSelect.addEventListener('change', (e) => {
        state.currentVoice = e.target.value;
    });

    // Generate all button
    elements.generateAllBtn.addEventListener('click', generateAllAudio);

    // Download all button
    elements.downloadAllBtn.addEventListener('click', downloadCombinedAudio);

    // Individual section buttons
    elements.sections.forEach(section => {
        const generateBtn = section.querySelector('.btn-generate');
        const playBtn = section.querySelector('.btn-play');
        const downloadBtn = section.querySelector('.btn-download-section');
        const audio = section.querySelector('.section-audio');
        const sectionId = section.dataset.section;

        generateBtn.addEventListener('click', () => generateSectionAudio(sectionId));

        playBtn.addEventListener('click', () => {
            if (audio.paused) {
                audio.play();
                playBtn.textContent = '⏸';
            } else {
                audio.pause();
                playBtn.textContent = '▶';
            }
        });

        audio.addEventListener('ended', () => {
            playBtn.textContent = '▶';
        });

        downloadBtn.addEventListener('click', () => downloadSectionAudio(sectionId));
    });
}

/**
 * Get text content from a section
 */
function getSectionText(sectionId) {
    const section = document.querySelector(`[data-section="${sectionId}"]`);
    if (!section) return '';

    const contentDiv = section.querySelector('.section-content');
    // Get all paragraph text, joining with spaces
    const paragraphs = contentDiv.querySelectorAll('p');
    return Array.from(paragraphs).map(p => p.textContent.trim()).join(' ');
}

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
    elements.status.textContent = message;
    elements.status.className = `status ${type}`;
    elements.status.classList.remove('hidden');
}

/**
 * Hide status
 */
function hideStatus() {
    elements.status.classList.add('hidden');
}

/**
 * Update progress bar
 */
function updateProgress(percent) {
    elements.progressContainer.classList.remove('hidden');
    elements.progressBar.style.width = `${percent}%`;
    elements.progressText.textContent = `${Math.round(percent)}%`;
}

/**
 * Hide progress bar
 */
function hideProgress() {
    elements.progressContainer.classList.add('hidden');
}

/**
 * Generate audio for a single section
 */
async function generateSectionAudio(sectionId) {
    const section = document.querySelector(`[data-section="${sectionId}"]`);
    const generateBtn = section.querySelector('.btn-generate');
    const playBtn = section.querySelector('.btn-play');
    const downloadBtn = section.querySelector('.btn-download-section');
    const audio = section.querySelector('.section-audio');

    try {
        // Update UI
        generateBtn.disabled = true;
        generateBtn.textContent = '...';
        showStatus(`Generating audio for ${sectionId}...`, 'info');

        // Get text content
        const text = getSectionText(sectionId);
        if (!text) {
            throw new Error('No text content found');
        }

        // Generate audio
        const audioBlob = await callElevenLabsAPI(text);

        if (!audioBlob) {
            throw new Error('Failed to generate audio');
        }

        // Store the blob
        state.generatedAudio[sectionId] = audioBlob;

        // Set up audio element
        const audioUrl = URL.createObjectURL(audioBlob);
        audio.src = audioUrl;

        // Show play and download buttons
        playBtn.classList.remove('hidden');
        downloadBtn.classList.remove('hidden');
        generateBtn.textContent = '✓';
        generateBtn.classList.add('done');

        showStatus(`Audio generated for ${sectionId}!`, 'success');
        setTimeout(hideStatus, 3000);

    } catch (error) {
        console.error('Error generating section audio:', error);
        showStatus(`Error: ${error.message}`, 'error');
        generateBtn.textContent = '🎙';
        generateBtn.disabled = false;
    }
}

/**
 * Generate all audio sections
 */
async function generateAllAudio() {
    if (state.isGenerating) return;
    state.isGenerating = true;

    elements.generateAllBtn.disabled = true;
    elements.generateAllBtn.innerHTML = '<span class="btn-icon">⏳</span> Generating...';

    const sectionIds = Array.from(elements.sections).map(s => s.dataset.section);
    const totalSections = sectionIds.length;
    let completedSections = 0;

    showStatus('Generating all audio sections...', 'info');
    updateProgress(0);

    try {
        for (const sectionId of sectionIds) {
            // Check if already generated
            if (!state.generatedAudio[sectionId]) {
                await generateSectionAudio(sectionId);
                // Add a small delay between API calls to be respectful
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            completedSections++;
            updateProgress((completedSections / totalSections) * 100);
        }

        // Combine all audio into one
        await combineAllAudio();

        showStatus('All audio sections generated!', 'success');
        elements.combinedPlayer.classList.remove('hidden');

    } catch (error) {
        console.error('Error generating all audio:', error);
        showStatus(`Error: ${error.message}`, 'error');
    } finally {
        state.isGenerating = false;
        elements.generateAllBtn.disabled = false;
        elements.generateAllBtn.innerHTML = '<span class="btn-icon">🎙</span> Generate All Audio';
        hideProgress();
    }
}

/**
 * Combine all generated audio into one file
 */
async function combineAllAudio() {
    const sectionIds = ['intro', 'big-picture', 'imsafe', 'fatigue-critical', 'fatigue-factors', 'outro'];
    const audioBlobs = [];

    for (const sectionId of sectionIds) {
        if (state.generatedAudio[sectionId]) {
            audioBlobs.push(state.generatedAudio[sectionId]);
        }
    }

    if (audioBlobs.length === 0) {
        throw new Error('No audio sections available to combine');
    }

    // For now, we'll just use the first section for the combined player
    // (True audio concatenation requires more complex handling)
    // In practice, users can download individual sections
    const combinedBlob = new Blob(audioBlobs, { type: 'audio/mpeg' });
    const combinedUrl = URL.createObjectURL(combinedBlob);
    elements.fullAudio.src = combinedUrl;

    // Store for download
    state.combinedAudioBlob = combinedBlob;
}

/**
 * Download combined audio
 */
function downloadCombinedAudio() {
    if (!state.combinedAudioBlob) {
        showStatus('Please generate audio first', 'error');
        return;
    }

    downloadBlob(state.combinedAudioBlob, 'SAR-Crew-Welfare-Audio-Guide.mp3');
}

/**
 * Download a single section's audio
 */
function downloadSectionAudio(sectionId) {
    const blob = state.generatedAudio[sectionId];
    if (!blob) {
        showStatus('Please generate this section first', 'error');
        return;
    }

    const filename = `SAR-Crew-Welfare-${sectionId}.mp3`;
    downloadBlob(blob, filename);
}

/**
 * Download a blob as a file
 */
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Call ElevenLabs API via worker
 */
async function callElevenLabsAPI(text) {
    const voiceConfig = CONFIG.voices[state.currentVoice];

    const response = await fetch(`${CONFIG.workerUrl}/speak`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text: text,
            voiceSettings: {
                voiceId: voiceConfig.voiceId,
                stability: voiceConfig.stability,
                similarity_boost: voiceConfig.similarity_boost,
                style: voiceConfig.style,
                use_speaker_boost: voiceConfig.use_speaker_boost
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs API error:', errorText);
        throw new Error('Failed to generate audio. Please try again.');
    }

    return await response.blob();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
