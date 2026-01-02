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

    // Create empty assistant message that we'll stream into
    const messageId = 'msg-' + Date.now();
    const messageDiv = createStreamingMessage(messageId);

    try {
        // Get AI response via streaming
        const fullResponse = await getChatResponseStreaming(messageDiv, messageId);

        // Add to conversation history
        state.conversationHistory.push({
            role: 'assistant',
            content: fullResponse
        });

        // Auto-detect accent if enabled
        if (state.autoDetect) {
            await detectAndUpdateAccent();
        }

        // Speak the response
        await speakText(fullResponse);

    } catch (error) {
        console.error('Error handling message:', error);
        removeStreamingMessage(messageId);
        addMessageToUI('assistant', 'Sorry, I encountered an error. Please try again.', state.currentAccent);
    }
}

/**
 * Get chat response from Claude API via worker (non-streaming fallback)
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
 * Get chat response with streaming
 */
async function getChatResponseStreaming(messageDiv, messageId) {
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
            system: buildSystemPrompt(),
            stream: true  // Enable streaming
        })
    });

    if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    const contentDiv = messageDiv.querySelector('.message-content');

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.type === 'content_block_delta') {
                            const text = parsed.delta?.text || '';
                            fullText += text;
                            contentDiv.textContent = fullText;

                            // Auto-scroll to bottom
                            elements.conversationHistory.parentElement.scrollTop =
                                elements.conversationHistory.parentElement.scrollHeight;
                        }
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }
        }
    } finally {
        reader.releaseLock();
    }

    // Add accent badge
    const accentBadge = document.createElement('div');
    accentBadge.className = 'message-style';
    accentBadge.textContent = `Speaking as: ${state.currentAccent}`;
    contentDiv.appendChild(accentBadge);

    return fullText;
}

/**
 * Create streaming message UI element
 */
function createStreamingMessage(messageId) {
    // Remove welcome message if it exists
    const welcomeMessage = elements.conversationHistory.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant';
    messageDiv.id = messageId;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = 'V';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = ''; // Empty, will be filled by stream

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);

    elements.conversationHistory.appendChild(messageDiv);

    // Scroll to bottom
    elements.conversationHistory.parentElement.scrollTop =
        elements.conversationHistory.parentElement.scrollHeight;

    return messageDiv;
}

/**
 * Remove streaming message (on error)
 */
function removeStreamingMessage(messageId) {
    const messageDiv = document.getElementById(messageId);
    if (messageDiv) {
        messageDiv.remove();
    }
}

/**
 * Build system prompt with accent instructions
 */
function buildSystemPrompt() {
    const accentInstruction = state.autoDetect
        ? 'Respond naturally and conversationally.'
        : `Respond in the style of: ${state.currentAccent}. Adjust your tone, word choice, and phrasing to match this style, but keep responses clear and helpful.`;

    return `You are Vox, a conversational AI assistant with dynamic voice personality. ${accentInstruction}

Be warm, engaging, and helpful. Keep responses conversational but informative. Don't mention that you're speaking in a particular accent unless directly asked about it.`;
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
 * Speak text using ElevenLabs via worker
 */
async function speakText(text) {
    try {
        // Stop any currently playing audio
        if (state.currentAudio) {
            state.currentAudio.pause();
            state.currentAudio = null;
        }

        // Calculate voice settings based on accent strength
        const strength = state.accentStrength / 100;
        const voiceSettings = {
            voiceId: CONFIG.defaultVoiceId,
            stability: 0.5,
            similarity_boost: 0.75,
            style: strength, // Use accent strength for style parameter
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
            console.warn('Text-to-speech failed:', response.status);
            return;
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
    } catch (error) {
        console.error('Error speaking text:', error);
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
