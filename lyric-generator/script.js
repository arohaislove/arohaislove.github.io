// =============================================================================
// DOM Elements
// =============================================================================

// Mode Toggle
const modeBtns = document.querySelectorAll('.mode-btn');
const audioSection = document.getElementById('audioSection');
const manualSection = document.getElementById('manualSection');

// Audio Mode Elements
const audioFileInput = document.getElementById('audioFile');
const recordBtn = document.getElementById('recordBtn');
const audioPlayer = document.getElementById('audioPlayer');
const audioPlayerSection = document.getElementById('audioPlayerSection');
const recordingControls = document.getElementById('recordingControls');
const recordingTime = document.getElementById('recordingTime');
const stopRecordingBtn = document.getElementById('stopRecordingBtn');
const analysisStatus = document.getElementById('analysisStatus');
const analysisResults = document.getElementById('analysisResults');
const themeAudioInput = document.getElementById('themeAudio');
const generateFromAudioBtn = document.getElementById('generateFromAudioBtn');

// Manual Mode Elements
const generateBtn = document.getElementById('generateBtn');
const moodInput = document.getElementById('mood');
const tempoInput = document.getElementById('tempo');
const energyInput = document.getElementById('energy');
const instrumentsInput = document.getElementById('instruments');
const structureInput = document.getElementById('structure');
const genreInput = document.getElementById('genre');
const themeInput = document.getElementById('theme');

// Output Elements
const regenerateBtn = document.getElementById('regenerateBtn');
const copyBtn = document.getElementById('copyBtn');
const outputSection = document.getElementById('outputSection');
const lyricsOutput = document.getElementById('lyricsOutput');

// =============================================================================
// State Management
// =============================================================================

let currentMode = 'audio';
let audioContext = null;
let analyser = null;
let audioBuffer = null;
let mediaRecorder = null;
let recordedChunks = [];
let recordingStartTime = null;
let recordingInterval = null;
let analysisData = null;
let lastParameters = null;

const API_URL = 'https://cors-proxy.zammel.workers.dev';

// =============================================================================
// Event Listeners
// =============================================================================

// Mode toggle
modeBtns.forEach(btn => {
    btn.addEventListener('click', () => switchMode(btn.dataset.mode));
});

// Audio mode
audioFileInput.addEventListener('change', handleFileUpload);
recordBtn.addEventListener('click', startRecording);
stopRecordingBtn.addEventListener('click', stopRecording);
generateFromAudioBtn.addEventListener('click', handleGenerateFromAudio);

// Manual mode
generateBtn.addEventListener('click', handleGenerateManual);

// Output
regenerateBtn.addEventListener('click', handleRegenerate);
copyBtn.addEventListener('click', handleCopy);

// =============================================================================
// Mode Switching
// =============================================================================

function switchMode(mode) {
    currentMode = mode;

    // Update button states
    modeBtns.forEach(btn => {
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Toggle sections
    if (mode === 'audio') {
        audioSection.classList.add('active');
        manualSection.classList.remove('active');
    } else {
        audioSection.classList.remove('active');
        manualSection.classList.add('active');
    }
}

// =============================================================================
// Audio File Upload
// =============================================================================

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Show audio player
    audioPlayerSection.style.display = 'block';
    audioPlayer.src = URL.createObjectURL(file);
    audioPlayer.style.display = 'block';
    recordingControls.style.display = 'none';

    // Analyze the audio
    await analyzeAudioFile(file);
}

// =============================================================================
// Microphone Recording
// =============================================================================

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        mediaRecorder = new MediaRecorder(stream);
        recordedChunks = [];

        mediaRecorder.addEventListener('dataavailable', (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        });

        mediaRecorder.addEventListener('stop', async () => {
            const blob = new Blob(recordedChunks, { type: 'audio/webm' });
            audioPlayer.src = URL.createObjectURL(blob);

            // Analyze the recorded audio
            await analyzeAudioFile(blob);
        });

        mediaRecorder.start();

        // Show recording UI
        audioPlayerSection.style.display = 'block';
        audioPlayer.style.display = 'none';
        recordingControls.style.display = 'flex';

        // Start recording timer
        recordingStartTime = Date.now();
        recordingInterval = setInterval(updateRecordingTime, 100);

    } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Could not access microphone. Please check permissions.');
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());

        // Stop timer
        clearInterval(recordingInterval);

        // Show audio player
        audioPlayer.style.display = 'block';
        recordingControls.style.display = 'none';
    }
}

function updateRecordingTime() {
    const elapsed = Date.now() - recordingStartTime;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    recordingTime.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// =============================================================================
// Audio Analysis
// =============================================================================

async function analyzeAudioFile(file) {
    analysisStatus.textContent = 'Analyzing audio...';
    analysisStatus.classList.add('analyzing');
    analysisResults.innerHTML = '';
    generateFromAudioBtn.disabled = true;

    try {
        // Initialize audio context if needed
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Load audio file into buffer
        const arrayBuffer = await file.arrayBuffer();
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Perform analysis
        const analysis = performAudioAnalysis(audioBuffer);
        analysisData = analysis;

        // Display results
        displayAnalysisResults(analysis);

        analysisStatus.textContent = 'Analysis complete! Ready to generate lyrics.';
        analysisStatus.classList.remove('analyzing');
        generateFromAudioBtn.disabled = false;

    } catch (error) {
        console.error('Error analyzing audio:', error);
        analysisStatus.textContent = 'Error analyzing audio. Please try again.';
        analysisStatus.classList.remove('analyzing');
    }
}

function performAudioAnalysis(buffer) {
    const sampleRate = buffer.sampleRate;
    const channelData = buffer.getChannelData(0);
    const duration = buffer.duration;

    // 1. Detect BPM
    const bpm = detectBPM(channelData, sampleRate);

    // 2. Analyze frequency content
    const freqAnalysis = analyzeFrequencies(buffer);

    // 3. Analyze energy/dynamics
    const energyAnalysis = analyzeEnergy(channelData, sampleRate);

    // 4. Detect structure (quiet/loud sections)
    const structure = analyzeStructure(channelData, sampleRate, duration);

    return {
        bpm,
        duration,
        ...freqAnalysis,
        ...energyAnalysis,
        structure
    };
}

// BPM Detection using autocorrelation
function detectBPM(channelData, sampleRate) {
    // Downsample for efficiency
    const downsample = 10;
    const data = [];
    for (let i = 0; i < channelData.length; i += downsample) {
        data.push(Math.abs(channelData[i]));
    }

    // Apply simple envelope follower
    const envelope = [];
    let prev = 0;
    const attack = 0.1;
    const release = 0.01;

    for (let i = 0; i < data.length; i++) {
        if (data[i] > prev) {
            prev = prev * (1 - attack) + data[i] * attack;
        } else {
            prev = prev * (1 - release) + data[i] * release;
        }
        envelope.push(prev);
    }

    // Find peaks
    const peaks = [];
    for (let i = 1; i < envelope.length - 1; i++) {
        if (envelope[i] > envelope[i - 1] && envelope[i] > envelope[i + 1] && envelope[i] > 0.1) {
            peaks.push(i);
        }
    }

    if (peaks.length < 2) return 120; // Default BPM

    // Calculate intervals between peaks
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
        intervals.push(peaks[i] - peaks[i - 1]);
    }

    // Find most common interval
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    // Convert to BPM
    const samplesPerBeat = avgInterval * downsample;
    const secondsPerBeat = samplesPerBeat / sampleRate;
    const bpm = Math.round(60 / secondsPerBeat);

    // Clamp to reasonable range
    if (bpm < 60) return bpm * 2;
    if (bpm > 180) return Math.round(bpm / 2);
    return bpm;
}

// Frequency analysis
function analyzeFrequencies(buffer) {
    const offlineContext = new OfflineAudioContext(1, buffer.length, buffer.sampleRate);
    const source = offlineContext.createBufferSource();
    source.buffer = buffer;

    const analyser = offlineContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyser.connect(offlineContext.destination);

    source.start();

    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(frequencyData);

    // Divide into bass, mid, treble
    const bass = frequencyData.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
    const mid = frequencyData.slice(10, 50).reduce((a, b) => a + b, 0) / 40;
    const treble = frequencyData.slice(50, 100).reduce((a, b) => a + b, 0) / 50;

    const total = bass + mid + treble;

    let dominantFreq = 'balanced';
    if (bass / total > 0.5) dominantFreq = 'bass-heavy';
    else if (treble / total > 0.45) dominantFreq = 'treble-heavy';
    else if (mid / total > 0.45) dominantFreq = 'mid-focused';

    return {
        bassLevel: Math.round((bass / 255) * 100),
        midLevel: Math.round((mid / 255) * 100),
        trebleLevel: Math.round((treble / 255) * 100),
        dominantFreq
    };
}

// Energy/Dynamics analysis
function analyzeEnergy(channelData, sampleRate) {
    // Calculate RMS energy over time
    const windowSize = sampleRate * 0.1; // 100ms windows
    const energyLevels = [];

    for (let i = 0; i < channelData.length; i += windowSize) {
        const window = channelData.slice(i, i + windowSize);
        const rms = Math.sqrt(window.reduce((sum, val) => sum + val * val, 0) / window.length);
        energyLevels.push(rms);
    }

    const avgEnergy = energyLevels.reduce((a, b) => a + b, 0) / energyLevels.length;
    const maxEnergy = Math.max(...energyLevels);
    const dynamicRange = maxEnergy / avgEnergy;

    let energyLevel = 'medium';
    if (avgEnergy < 0.1) energyLevel = 'low';
    else if (avgEnergy > 0.3) energyLevel = 'high';

    let dynamics = 'moderate';
    if (dynamicRange > 3) dynamics = 'wide dynamic range';
    else if (dynamicRange < 1.5) dynamics = 'compressed/consistent';

    return {
        energyLevel,
        dynamics,
        avgEnergy: Math.round(avgEnergy * 100),
        dynamicRange: dynamicRange.toFixed(1)
    };
}

// Structure analysis
function analyzeStructure(channelData, sampleRate, duration) {
    const windowSize = sampleRate * 2; // 2-second windows
    const sections = [];

    for (let i = 0; i < channelData.length; i += windowSize) {
        const window = channelData.slice(i, i + windowSize);
        const rms = Math.sqrt(window.reduce((sum, val) => sum + val * val, 0) / window.length);
        const time = i / sampleRate;

        sections.push({ time, energy: rms });
    }

    const avgEnergy = sections.reduce((sum, s) => sum + s.energy, 0) / sections.length;

    const description = [];

    // Analyze progression
    const firstThird = sections.slice(0, Math.floor(sections.length / 3));
    const lastThird = sections.slice(Math.floor(sections.length * 2 / 3));

    const startEnergy = firstThird.reduce((s, sec) => s + sec.energy, 0) / firstThird.length;
    const endEnergy = lastThird.reduce((s, sec) => s + sec.energy, 0) / lastThird.length;

    if (startEnergy < avgEnergy * 0.7) {
        description.push('Starts quiet');
    } else if (startEnergy > avgEnergy * 1.2) {
        description.push('Starts energetic');
    }

    // Find peak
    const peakSection = sections.reduce((max, sec) => sec.energy > max.energy ? sec : max, sections[0]);
    const peakTime = Math.round(peakSection.time);
    if (peakSection.energy > avgEnergy * 1.5) {
        description.push(`Builds to peak around ${Math.floor(peakTime / 60)}:${(peakTime % 60).toString().padStart(2, '0')}`);
    }

    if (endEnergy < avgEnergy * 0.7) {
        description.push('Fades out');
    }

    return description.join(', ') || 'Consistent energy throughout';
}

// Display analysis results
function displayAnalysisResults(analysis) {
    analysisResults.innerHTML = `
        <div class="analysis-item">
            <label>Tempo</label>
            <value>${analysis.bpm} BPM</value>
        </div>
        <div class="analysis-item">
            <label>Energy</label>
            <value>${analysis.energyLevel}</value>
        </div>
        <div class="analysis-item">
            <label>Duration</label>
            <value>${Math.floor(analysis.duration / 60)}:${Math.floor(analysis.duration % 60).toString().padStart(2, '0')}</value>
        </div>
        <div class="analysis-item">
            <label>Bass</label>
            <value>${analysis.bassLevel}%</value>
        </div>
        <div class="analysis-item">
            <label>Mids</label>
            <value>${analysis.midLevel}%</value>
        </div>
        <div class="analysis-item">
            <label>Treble</label>
            <value>${analysis.trebleLevel}%</value>
        </div>
    `;
}

// =============================================================================
// Lyric Generation
// =============================================================================

async function handleGenerateFromAudio() {
    if (!analysisData) {
        alert('Please upload or record audio first.');
        return;
    }

    const params = buildParamsFromAnalysis(analysisData);
    params.theme = themeAudioInput.value.trim();

    lastParameters = params;
    await generateLyrics(params, generateFromAudioBtn);
}

async function handleGenerateManual() {
    const params = {
        mood: moodInput.value.trim(),
        tempo: tempoInput.value.trim(),
        energy: energyInput.value,
        instruments: instrumentsInput.value.trim(),
        structure: structureInput.value.trim(),
        genre: genreInput.value.trim(),
        theme: themeInput.value.trim()
    };

    if (!params.mood && !params.instruments && !params.genre) {
        alert('Please fill in at least mood, instruments, or genre to help guide the lyric generation.');
        return;
    }

    lastParameters = params;
    await generateLyrics(params, generateBtn);
}

function buildParamsFromAnalysis(analysis) {
    // Infer mood from audio characteristics
    let mood = '';
    if (analysis.energyLevel === 'low' && analysis.bassLevel > 50) {
        mood = 'melancholic, introspective';
    } else if (analysis.energyLevel === 'high' && analysis.trebleLevel > 50) {
        mood = 'energetic, bright';
    } else if (analysis.dominantFreq === 'bass-heavy') {
        mood = 'deep, heavy, grounded';
    } else if (analysis.dominantFreq === 'treble-heavy') {
        mood = 'ethereal, light, airy';
    } else {
        mood = 'balanced, flowing';
    }

    // Infer instruments from frequency content
    let instruments = '';
    if (analysis.bassLevel > 60) {
        instruments = 'bass-heavy instruments (drums, bass guitar, synth bass)';
    } else if (analysis.trebleLevel > 60) {
        instruments = 'bright instruments (piano, guitar, high synths)';
    } else {
        instruments = 'balanced mix of instruments';
    }

    return {
        mood,
        tempo: analysis.bpm.toString(),
        energy: analysis.energyLevel,
        instruments,
        structure: analysis.structure,
        genre: '', // Let AI infer
        theme: '',
        fromAudioAnalysis: true,
        analysisDetails: `Dominant frequencies: ${analysis.dominantFreq}, Dynamics: ${analysis.dynamics}`
    };
}

async function generateLyrics(params, button) {
    button.disabled = true;
    button.classList.add('loading');
    lyricsOutput.textContent = 'Listening to the instrumental, finding the melody...';
    outputSection.classList.add('visible');

    try {
        const prompt = buildLyricPrompt(params);

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 2048,
                messages: [{
                    role: 'user',
                    content: prompt
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const lyrics = data.content[0].text;
        displayLyrics(lyrics);

    } catch (error) {
        console.error('Error generating lyrics:', error);
        lyricsOutput.textContent = `Error: ${error.message}\n\nPlease try again.`;
    } finally {
        button.disabled = false;
        button.classList.remove('loading');
    }
}

function buildLyricPrompt(params) {
    let description = [];

    if (params.mood) description.push(`Mood/Atmosphere: ${params.mood}`);
    if (params.tempo) description.push(`Tempo: ${params.tempo} BPM`);
    if (params.energy) description.push(`Energy Level: ${params.energy}`);
    if (params.instruments) description.push(`Instruments/Textures: ${params.instruments}`);
    if (params.structure) description.push(`Structure/Dynamics: ${params.structure}`);
    if (params.genre) description.push(`Genre/Style: ${params.genre}`);
    if (params.analysisDetails) description.push(`Audio Analysis: ${params.analysisDetails}`);

    const trackDescription = description.join('\n');

    const systemPrompt = `You are a lyricist translating instrumental music into words. You've been given an analysis of an instrumental track${params.fromAudioAnalysis ? ' (analyzed from actual audio)' : ''}.

**Your Process:**

1. FEEL THE ATMOSPHERE
What emotional story does this music tell without words? Is it yearning? Triumphant? Haunted? Restless?

2. FIND THE VOCAL POCKET
Based on the tempo and rhythm, imagine where a voice would naturally land. Write lyrics that breathe with the music — not cramming words into every beat.

3. MATCH INTENSITY TO DYNAMICS
- Quieter sections → more intimate, sparse lyrics
- Building sections → rising tension in the words
- Climactic moments → emotional peaks, hooks, release

4. SYLLABLE CONSCIOUSNESS
Write with the rhythm in mind. If it's a driving 120 BPM rock track, punchy consonants. If it's a floating ambient piece, longer vowel sounds.

5. LEAVE SPACE
Not everything has to be expressed with words — let the instruments tell their side of the story.

Generate lyrics that feel like they were BORN from this music, not pasted on top of it.

${params.theme ? `\n**Thematic Direction:** The lyrics should explore themes of: ${params.theme}` : ''}`;

    return `${systemPrompt}

**Instrumental Track Analysis:**

${trackDescription}

Please generate lyrics for this instrumental. Include verse/chorus structure markers if appropriate. The lyrics should feel natural when sung to this music.`;
}

function displayLyrics(lyrics) {
    lyricsOutput.style.opacity = '0';
    lyricsOutput.textContent = lyrics;

    setTimeout(() => {
        lyricsOutput.style.transition = 'opacity 0.6s ease';
        lyricsOutput.style.opacity = '1';
    }, 50);
}

async function handleRegenerate() {
    if (!lastParameters) return;

    const button = currentMode === 'audio' ? generateFromAudioBtn : generateBtn;
    await generateLyrics(lastParameters, button);
}

async function handleCopy() {
    const lyrics = lyricsOutput.textContent;

    if (!lyrics || lyrics.includes('Your lyrics will appear here')) {
        return;
    }

    try {
        await navigator.clipboard.writeText(lyrics);

        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;
        copyBtn.style.background = 'var(--accent-primary)';
        copyBtn.style.color = 'white';
        copyBtn.style.borderColor = 'var(--accent-primary)';

        setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
            copyBtn.style.background = '';
            copyBtn.style.color = '';
            copyBtn.style.borderColor = '';
        }, 2000);

    } catch (error) {
        console.error('Failed to copy:', error);
        alert('Failed to copy to clipboard. Please select and copy manually.');
    }
}

// Smooth scroll observer
const scrollObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.target.classList.contains('visible')) {
            setTimeout(() => {
                mutation.target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                });
            }, 300);
        }
    });
});

scrollObserver.observe(outputSection, {
    attributes: true,
    attributeFilter: ['class']
});
