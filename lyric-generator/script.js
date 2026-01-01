// DOM Elements
const generateBtn = document.getElementById('generateBtn');
const regenerateBtn = document.getElementById('regenerateBtn');
const copyBtn = document.getElementById('copyBtn');
const outputSection = document.getElementById('outputSection');
const lyricsOutput = document.getElementById('lyricsOutput');

// Form elements
const moodInput = document.getElementById('mood');
const tempoInput = document.getElementById('tempo');
const energyInput = document.getElementById('energy');
const instrumentsInput = document.getElementById('instruments');
const structureInput = document.getElementById('structure');
const genreInput = document.getElementById('genre');
const themeInput = document.getElementById('theme');

// API Configuration
const API_URL = 'https://cors-proxy.zammel.workers.dev';

// Store last parameters for regeneration
let lastParameters = null;

// Event Listeners
generateBtn.addEventListener('click', handleGenerate);
regenerateBtn.addEventListener('click', handleRegenerate);
copyBtn.addEventListener('click', handleCopy);

/**
 * Generate lyrics based on form inputs
 */
async function handleGenerate() {
    // Collect form data
    const params = {
        mood: moodInput.value.trim(),
        tempo: tempoInput.value.trim(),
        energy: energyInput.value,
        instruments: instrumentsInput.value.trim(),
        structure: structureInput.value.trim(),
        genre: genreInput.value.trim(),
        theme: themeInput.value.trim()
    };

    // Basic validation
    if (!params.mood && !params.instruments && !params.genre) {
        alert('Please fill in at least mood, instruments, or genre to help guide the lyric generation.');
        return;
    }

    // Store parameters for regeneration
    lastParameters = params;

    // Generate lyrics
    await generateLyrics(params);
}

/**
 * Regenerate lyrics with same parameters
 */
async function handleRegenerate() {
    if (!lastParameters) return;
    await generateLyrics(lastParameters);
}

/**
 * Generate lyrics by calling Claude API
 */
async function generateLyrics(params) {
    // Show loading state
    generateBtn.disabled = true;
    generateBtn.classList.add('loading');
    lyricsOutput.textContent = 'Listening to the instrumental, finding the melody...';
    outputSection.classList.add('visible');

    try {
        // Build the prompt for Claude
        const prompt = buildLyricPrompt(params);

        // Call the API
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

        // Extract the lyrics from the response
        const lyrics = data.content[0].text;

        // Display the lyrics
        displayLyrics(lyrics);

    } catch (error) {
        console.error('Error generating lyrics:', error);
        lyricsOutput.textContent = `Error: ${error.message}\n\nPlease try again.`;
    } finally {
        // Remove loading state
        generateBtn.disabled = false;
        generateBtn.classList.remove('loading');
    }
}

/**
 * Build the prompt for Claude based on user inputs
 */
function buildLyricPrompt(params) {
    let description = [];

    if (params.mood) description.push(`Mood/Atmosphere: ${params.mood}`);
    if (params.tempo) description.push(`Tempo: ${params.tempo} BPM`);
    if (params.energy) description.push(`Energy Level: ${params.energy}`);
    if (params.instruments) description.push(`Instruments/Textures: ${params.instruments}`);
    if (params.structure) description.push(`Structure/Dynamics: ${params.structure}`);
    if (params.genre) description.push(`Genre/Style: ${params.genre}`);

    const trackDescription = description.join('\n');

    const systemPrompt = `You are a lyricist translating instrumental music into words. You've been given an analysis of an instrumental track.

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

/**
 * Display the generated lyrics
 */
function displayLyrics(lyrics) {
    // Add a gentle fade-in animation
    lyricsOutput.style.opacity = '0';
    lyricsOutput.textContent = lyrics;

    setTimeout(() => {
        lyricsOutput.style.transition = 'opacity 0.6s ease';
        lyricsOutput.style.opacity = '1';
    }, 50);
}

/**
 * Copy lyrics to clipboard
 */
async function handleCopy() {
    const lyrics = lyricsOutput.textContent;

    if (!lyrics || lyrics.includes('Your lyrics will appear here')) {
        return;
    }

    try {
        await navigator.clipboard.writeText(lyrics);

        // Visual feedback
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

// Add smooth scroll to output when it appears
const observer = new MutationObserver((mutations) => {
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

observer.observe(outputSection, {
    attributes: true,
    attributeFilter: ['class']
});
