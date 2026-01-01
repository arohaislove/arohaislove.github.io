/**
 * Vox - Conversational AI with Dynamic Accents
 * Main JavaScript functionality
 */

// Configuration
const CONFIG = {
    workerUrl: 'https://vox-api.zammel.workers.dev',
    defaultAccent: 'Warm & Gentle',
    defaultVoiceId: '21m00Tcm4TlvDq8ikWAM' // ElevenLabs default voice
};

// Application state
const state = {
    conversationHistory: [],
    currentAccent: CONFIG.defaultAccent,
    autoDetect: true,
    accentStrength: 50,
    isListening: false,
    recognition: null,
    currentAudio: null
};

// DOM elements
const elements = {
    autoDetect: document.getElementById('autoDetect'),
    manualControls: document.getElementById('manualControls'),
    currentStyle: document.getElementById('currentStyle'),
    autoBadge: document.getElementById('autoBadge'),
    conversationHistory: document.getElementById('conversationHistory'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    voiceBtn: document.getElementById('voiceBtn'),
    listeningIndicator: document.getElementById('listeningIndicator'),
    accentStrength: document.getElementById('accentStrength'),
    accentBtns: document.querySelectorAll('.accent-btn')
};

/**
 * Initialize the application
 */
function init() {
    setupEventListeners();
    setupSpeechRecognition();
    updateCurrentStyleDisplay();
    loadBrowserVoices();
}

/**
 * Load browser speech synthesis voices
 */
function loadBrowserVoices() {
    if ('speechSynthesis' in window) {
        // Load voices (they load asynchronously)
        window.speechSynthesis.getVoices();

        // Some browsers need this event listener
        window.speechSynthesis.onvoiceschanged = () => {
            window.speechSynthesis.getVoices();
        };
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Auto-detect toggle
    elements.autoDetect.addEventListener('change', (e) => {
        state.autoDetect = e.target.checked;
        elements.manualControls.style.display = state.autoDetect ? 'none' : 'block';
        elements.autoBadge.style.display = state.autoDetect ? 'inline-block' : 'none';
    });

    // Accent buttons
    elements.accentBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            elements.accentBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            // Update current accent
            state.currentAccent = btn.dataset.accent;
            updateCurrentStyleDisplay();
        });
    });

    // Accent strength slider
    elements.accentStrength.addEventListener('input', (e) => {
        state.accentStrength = parseInt(e.target.value);
    });

    // Send button
    elements.sendBtn.addEventListener('click', handleSendMessage);

    // Enter key in input
    elements.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    });

    // Voice button
    elements.voiceBtn.addEventListener('click', toggleListening);
}

/**
 * Set up Web Speech API for voice input
 */
function setupSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('Speech recognition not supported in this browser');
        elements.voiceBtn.disabled = true;
        elements.voiceBtn.title = 'Speech recognition not supported';
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    state.recognition = new SpeechRecognition();
    state.recognition.continuous = false;
    state.recognition.interimResults = false;
    state.recognition.lang = 'en-US';

    state.recognition.onstart = () => {
        state.isListening = true;
        elements.voiceBtn.classList.add('listening');
        elements.listeningIndicator.style.display = 'flex';
    };

    state.recognition.onend = () => {
        state.isListening = false;
        elements.voiceBtn.classList.remove('listening');
        elements.listeningIndicator.style.display = 'none';
    };

    state.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        elements.messageInput.value = transcript;
        handleSendMessage();
    };

    state.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        state.isListening = false;
        elements.voiceBtn.classList.remove('listening');
        elements.listeningIndicator.style.display = 'none';
    };
}

/**
 * Toggle listening state
 */
function toggleListening() {
    if (!state.recognition) return;

    if (state.isListening) {
        state.recognition.stop();
    } else {
        state.recognition.start();
    }
}

/**
 * Handle sending a message
 */
async function handleSendMessage() {
    const message = elements.messageInput.value.trim();
    if (!message) return;

    // Clear input
    elements.messageInput.value = '';

    // Add user message to UI
    addMessageToUI('user', message);

    // Add to conversation history
    state.conversationHistory.push({
        role: 'user',
        content: message
    });

    // Show loading indicator
    const loadingId = addLoadingMessage();

    try {
        // Get AI response
        const response = await getChatResponse(message);

        // Remove loading indicator
        removeLoadingMessage(loadingId);

        // Add AI message to UI
        addMessageToUI('assistant', response, state.currentAccent);

        // Add to conversation history
        state.conversationHistory.push({
            role: 'assistant',
            content: response
        });

        // Auto-detect accent if enabled
        if (state.autoDetect) {
            await detectAndUpdateAccent();
        }

        // Speak the response
        await speakText(response);

    } catch (error) {
        console.error('Error handling message:', error);
        removeLoadingMessage(loadingId);
        addMessageToUI('assistant', 'Sorry, I encountered an error. Please try again.', state.currentAccent);
    }
}

/**
 * Get chat response from Claude API via worker
 */
async function getChatResponse(userMessage) {
    const response = await fetch(`${CONFIG.workerUrl}/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages: state.conversationHistory.map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            system: buildSystemPrompt()
        })
    });

    if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
}

/**
 * Build system prompt with accent instructions and response length scaling
 */
function buildSystemPrompt() {
    const accentInstruction = state.autoDetect
        ? 'Respond naturally and conversationally.'
        : `Respond in the style of: ${state.currentAccent}. Adjust your tone, word choice, and phrasing to match this style, but keep responses clear and helpful.`;

    // Calculate suggested response length based on last user message
    const lastUserMessage = state.conversationHistory.length > 0
        ? state.conversationHistory[state.conversationHistory.length - 1].content
        : '';

    const userSentenceCount = countSentences(lastUserMessage);
    const targetSentenceCount = Math.min(userSentenceCount * 2, 6); // Max 6 sentences to save tokens

    const lengthInstruction = `IMPORTANT: Keep your response CONCISE - aim for ${targetSentenceCount} sentence${targetSentenceCount === 1 ? '' : 's'} or less. Be brief but complete.`;

    return `You are Vox, a conversational AI assistant with dynamic voice personality. ${accentInstruction}

${lengthInstruction}

Be warm, engaging, and helpful. Keep responses conversational but informative. Don't mention that you're speaking in a particular accent unless directly asked about it.`;
}

/**
 * Count sentences in text (rough approximation)
 */
function countSentences(text) {
    if (!text || text.trim().length === 0) return 1;
    // Count periods, exclamation marks, and question marks
    const matches = text.match(/[.!?]+/g);
    return matches ? Math.max(1, matches.length) : 1;
}

/**
 * Detect and update accent based on conversation
 */
async function detectAndUpdateAccent() {
    try {
        // Get last few messages for context
        const recentHistory = state.conversationHistory.slice(-6);
        const conversationText = recentHistory
            .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
            .join('\n');

        const response = await fetch(`${CONFIG.workerUrl}/detect-accent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                conversationHistory: conversationText
            })
        });

        if (!response.ok) {
            console.warn('Accent detection failed, using default');
            return;
        }

        const data = await response.json();
        if (data.suggestedStyle) {
            state.currentAccent = data.suggestedStyle;
            updateCurrentStyleDisplay();
        }
    } catch (error) {
        console.error('Error detecting accent:', error);
    }
}

/**
 * Speak text using ElevenLabs via worker, with browser speech fallback
 */
async function speakText(text) {
    try {
        // Stop any currently playing audio
        if (state.currentAudio) {
            state.currentAudio.pause();
            state.currentAudio = null;
        }

        // Try ElevenLabs first
        const elevenLabsSuccess = await tryElevenLabsSpeech(text);

        // If ElevenLabs failed, fall back to browser speech
        if (!elevenLabsSuccess) {
            console.log('Falling back to browser speech synthesis');
            useBrowserSpeech(text);
        }
    } catch (error) {
        console.error('Error speaking text:', error);
        // Last resort: try browser speech
        useBrowserSpeech(text);
    }
}

/**
 * Try to speak using ElevenLabs API
 * Returns true if successful, false if failed
 */
async function tryElevenLabsSpeech(text) {
    try {
        // Calculate voice settings based on accent strength
        const strength = state.accentStrength / 100;
        const voiceSettings = {
            voiceId: CONFIG.defaultVoiceId,
            stability: 0.5,
            similarity_boost: 0.75,
            style: strength,
            use_speaker_boost: true
        };

        const response = await fetch(`${CONFIG.workerUrl}/speak`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                voiceSettings: voiceSettings
            })
        });

        if (!response.ok) {
            // Check if it's a configuration error
            if (response.status === 500) {
                const errorData = await response.json().catch(() => ({}));

                // Log the full error for debugging
                console.error('🔴 ElevenLabs Error:', {
                    status: response.status,
                    errorData: errorData,
                    message: errorData.message
                });

                // Show user-friendly error message
                showElevenLabsError(errorData.message || 'Unknown error');

                if (errorData.message && errorData.message.includes('ELEVENLABS_API_KEY')) {
                    console.warn('⚠️ ElevenLabs API key not configured. Using browser speech instead.');
                    showConfigNotice();
                }
            }
            return false;
        }

        // Get audio blob and play
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        state.currentAudio = audio;

        audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            state.currentAudio = null;
        };

        await audio.play();
        return true;
    } catch (error) {
        console.warn('ElevenLabs speech failed:', error);
        return false;
    }
}

/**
 * Use browser's built-in speech synthesis as fallback
 */
function useBrowserSpeech(text) {
    // Check if browser supports speech synthesis
    if (!('speechSynthesis' in window)) {
        console.warn('Browser speech synthesis not supported');
        return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);

    // Try to match the accent/style with available voices
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = selectBrowserVoice(voices, state.currentAccent);

    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    // Adjust rate and pitch based on accent
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Speak
    window.speechSynthesis.speak(utterance);
}

/**
 * Select best browser voice based on desired accent
 */
function selectBrowserVoice(voices, accent) {
    if (!voices || voices.length === 0) return null;

    // Map accent styles to voice characteristics
    const accentMap = {
        'Welsh': ['Welsh', 'GB', 'UK'],
        'Irish Storyteller': ['Irish', 'IE'],
        'Scottish Highlander': ['Scottish', 'GB'],
        'Kiwi Casual': ['New Zealand', 'NZ'],
        'Southland NZ': ['New Zealand', 'NZ'],
        'West Coast NZ': ['New Zealand', 'NZ'],
        'Te Reo-inflected': ['New Zealand', 'NZ'],
        'Victorian Butler': ['GB', 'British', 'UK'],
        'Shakespearean': ['GB', 'British', 'UK'],
        'Ship\'s Captain': ['GB', 'British', 'UK']
    };

    const keywords = accentMap[accent] || ['US', 'en-US'];

    // Try to find a matching voice
    for (const keyword of keywords) {
        const match = voices.find(v =>
            v.lang.includes(keyword) ||
            v.name.includes(keyword)
        );
        if (match) return match;
    }

    // Default to first English voice
    return voices.find(v => v.lang.startsWith('en')) || voices[0];
}

/**
 * Show one-time notice about ElevenLabs configuration
 */
let configNoticeShown = false;
function showConfigNotice() {
    if (configNoticeShown) return;
    configNoticeShown = true;

    // Add a subtle notice to the UI
    const notice = document.createElement('div');
    notice.className = 'config-notice';
    notice.innerHTML = `
        <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 12px; margin: 10px 0; font-size: 0.9em;">
            <strong>ℹ️ Using Browser Speech</strong><br>
            For premium AI voices with accents, the ElevenLabs API key needs to be configured.
            <br>Using your browser's built-in voices for now.
        </div>
    `;

    const conversationHistory = document.getElementById('conversationHistory');
    if (conversationHistory && conversationHistory.children.length > 0) {
        conversationHistory.insertBefore(notice, conversationHistory.children[0]);
    }
}

/**
 * Show ElevenLabs error message
 */
function showElevenLabsError(errorMessage) {
    const notice = document.createElement('div');
    notice.className = 'elevenlabs-error';
    notice.innerHTML = `
        <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 12px; margin: 10px 0; font-size: 0.9em; color: #721c24;">
            <strong>🔴 ElevenLabs Error:</strong><br>
            ${errorMessage}<br>
            <small style="margin-top: 8px; display: block;">Open browser console (F12) to see full error details.</small>
        </div>
    `;

    const conversationHistory = document.getElementById('conversationHistory');
    if (conversationHistory && conversationHistory.children.length > 0) {
        conversationHistory.insertBefore(notice, conversationHistory.children[0]);
    }
}

/**
 * Add message to UI
 */
function addMessageToUI(role, content, accent = null) {
    // Remove welcome message if it exists
    const welcomeMessage = elements.conversationHistory.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? 'U' : 'V';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;

    // Add accent badge for assistant messages
    if (role === 'assistant' && accent) {
        const accentBadge = document.createElement('div');
        accentBadge.className = 'message-style';
        accentBadge.textContent = `Speaking as: ${accent}`;
        contentDiv.appendChild(accentBadge);
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);

    elements.conversationHistory.appendChild(messageDiv);

    // Scroll to bottom
    elements.conversationHistory.parentElement.scrollTop = elements.conversationHistory.parentElement.scrollHeight;
}

/**
 * Add loading message
 */
function addLoadingMessage() {
    const loadingId = 'loading-' + Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant loading';
    messageDiv.id = loadingId;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = 'V';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = '<span></span><span></span><span></span>';

    contentDiv.appendChild(typingIndicator);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);

    elements.conversationHistory.appendChild(messageDiv);

    // Scroll to bottom
    elements.conversationHistory.parentElement.scrollTop = elements.conversationHistory.parentElement.scrollHeight;

    return loadingId;
}

/**
 * Remove loading message
 */
function removeLoadingMessage(loadingId) {
    const loadingMessage = document.getElementById(loadingId);
    if (loadingMessage) {
        loadingMessage.remove();
    }
}

/**
 * Update current style display
 */
function updateCurrentStyleDisplay() {
    const styleBadge = elements.currentStyle.querySelector('.style-badge');
    if (styleBadge) {
        styleBadge.textContent = state.currentAccent;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
