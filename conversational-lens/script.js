/**
 * Conversational Lens
 * Main application logic
 */

// API endpoint - will be deployed to Cloudflare Workers
const API_ENDPOINT = 'https://conversational-lens-api.zammel.workers.dev';

// State
let currentAnalysis = null;
let allExpanded = false;

// DOM Elements
const inputView = document.getElementById('input-view');
const resultsView = document.getElementById('results-view');
const errorView = document.getElementById('error-view');
const conversationInput = document.getElementById('conversation-input');
const analyzeBtn = document.getElementById('analyze-btn');
const backBtn = document.getElementById('back-btn');
const errorBackBtn = document.getElementById('error-back-btn');
const expandAllBtn = document.getElementById('expand-all-btn');
const conversationDisplay = document.getElementById('conversation-display');
const errorMessage = document.querySelector('.error-message');

// Event Listeners
analyzeBtn.addEventListener('click', handleAnalyze);
backBtn.addEventListener('click', showInputView);
errorBackBtn.addEventListener('click', showInputView);
expandAllBtn.addEventListener('click', toggleExpandAll);

// Handle Enter key in textarea (Ctrl/Cmd + Enter to submit)
conversationInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleAnalyze();
    }
});

/**
 * Main analyze function
 */
async function handleAnalyze() {
    const conversation = conversationInput.value.trim();

    if (!conversation) {
        showError('Please enter a conversation to analyze.');
        return;
    }

    // Set loading state
    analyzeBtn.disabled = true;
    analyzeBtn.classList.add('loading');

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ conversation })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Analysis failed');
        }

        const data = await response.json();
        currentAnalysis = data;

        // Render results
        renderConversation(data);
        showResultsView();

    } catch (error) {
        console.error('Analysis error:', error);
        showError(`Error: ${error.message}`);
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.classList.remove('loading');
    }
}

/**
 * Render the analyzed conversation
 */
function renderConversation(data) {
    conversationDisplay.innerHTML = '';

    if (!data.utterances || data.utterances.length === 0) {
        conversationDisplay.innerHTML = '<p class="error-message">No utterances found in the analysis.</p>';
        return;
    }

    data.utterances.forEach((utterance, index) => {
        const utteranceEl = createUtteranceElement(utterance, index);
        conversationDisplay.appendChild(utteranceEl);
    });
}

/**
 * Create an utterance element
 */
function createUtteranceElement(utterance, index) {
    const div = document.createElement('div');
    div.className = 'utterance';
    div.dataset.index = index;

    // Calculate border color
    const borderColor = calculateBorderColor(utterance.lenses);
    div.style.borderLeftColor = borderColor;

    // Create utterance content
    div.innerHTML = `
        <div class="utterance-header">
            <span class="utterance-speaker">${escapeHtml(utterance.speaker)}</span>
        </div>
        <div class="utterance-text">${escapeHtml(utterance.text)}</div>
        <div class="lens-panel">
            ${renderLensPanel(utterance.lenses)}
        </div>
    `;

    // Add click handler for expand/collapse
    div.addEventListener('click', () => toggleUtterance(div));

    return div;
}

/**
 * Render the lens panel content
 */
function renderLensPanel(lenses) {
    const ta = lenses.transactional_analysis;
    const sa = lenses.speech_act;
    const er = lenses.emotional_register;

    return `
        <div class="lens-grid">
            <div class="lens">
                <div class="lens-title">Transactional Analysis</div>
                <div class="lens-content">
                    <div class="lens-item">
                        <span class="lens-label">Ego state:</span>
                        <span class="lens-value">${formatEgoState(ta.ego_state)}</span>
                    </div>
                    <div class="lens-item">
                        <span class="lens-label">Transaction:</span>
                        <span class="lens-value">${capitalize(ta.transaction_type)}</span>
                    </div>
                </div>
            </div>
            <div class="lens">
                <div class="lens-title">Speech Acts</div>
                <div class="lens-content">
                    <div class="lens-item">
                        <span class="lens-label">Primary:</span>
                        <span class="lens-value">${capitalize(sa.primary)}</span>
                    </div>
                    ${sa.indirect && sa.indirect !== 'none' ? `
                        <div class="lens-item">
                            <span class="lens-label">Indirect:</span>
                            <span class="lens-value">${capitalize(sa.indirect)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="lens">
                <div class="lens-title">Emotional Register</div>
                <div class="lens-content">
                    <div class="lens-item">
                        <span class="lens-label">Surface:</span>
                        <span class="lens-value">${capitalize(er.surface)}</span>
                    </div>
                    ${er.underlying !== er.surface ? `
                        <div class="lens-item">
                            <span class="lens-label">Underlying:</span>
                            <span class="lens-value">${capitalize(er.underlying)}</span>
                        </div>
                    ` : ''}
                    <div class="lens-item">
                        <span class="lens-label">Intensity:</span>
                        <span class="lens-value">${renderIntensity(er.intensity)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render intensity as dots
 */
function renderIntensity(intensity) {
    const dots = [];
    for (let i = 1; i <= 5; i++) {
        const filled = i <= intensity ? 'filled' : '';
        dots.push(`<span class="intensity-dot ${filled}"></span>`);
    }
    return `<span class="intensity-dots">${dots.join('')}</span>`;
}

/**
 * Format ego state for display
 */
function formatEgoState(egoState) {
    return egoState
        .split('-')
        .map(word => capitalize(word))
        .join(' - ');
}

/**
 * Calculate border color based on TA and emotional intensity
 * Warm (red/orange) for Parent, Neutral (gray/blue) for Adult, Cool (blue/cyan) for Child
 * Saturation based on emotional intensity (1-5 scale)
 */
function calculateBorderColor(lenses) {
    const egoState = lenses.transactional_analysis.ego_state.toLowerCase();
    const intensity = lenses.emotional_register.intensity;

    // Base hue based on ego state
    let hue;
    if (egoState.includes('parent')) {
        hue = 15; // Warm orange-red
    } else if (egoState.includes('adult')) {
        hue = 210; // Neutral blue
    } else if (egoState.includes('child')) {
        hue = 190; // Cool cyan-blue
    } else {
        hue = 210; // Default to neutral
    }

    // Saturation based on intensity (20-60% range for subtlety)
    const saturation = 20 + (intensity * 8);

    // Lightness stays in a muted range (45-65%)
    const lightness = 55;

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Toggle individual utterance
 */
function toggleUtterance(element) {
    element.classList.toggle('expanded');
}

/**
 * Toggle all utterances
 */
function toggleExpandAll() {
    allExpanded = !allExpanded;
    const utterances = document.querySelectorAll('.utterance');

    utterances.forEach(utterance => {
        if (allExpanded) {
            utterance.classList.add('expanded');
        } else {
            utterance.classList.remove('expanded');
        }
    });

    expandAllBtn.textContent = allExpanded ? 'Collapse All' : 'Expand All';
}

/**
 * View management
 */
function showInputView() {
    inputView.classList.add('view-active');
    resultsView.classList.remove('view-active');
    errorView.classList.remove('active');
    allExpanded = false;
    expandAllBtn.textContent = 'Expand All';
}

function showResultsView() {
    inputView.classList.remove('view-active');
    resultsView.classList.add('view-active');
    errorView.classList.remove('active');
}

function showError(message) {
    errorMessage.textContent = message;
    inputView.classList.remove('view-active');
    resultsView.classList.remove('view-active');
    errorView.classList.add('active');
}

/**
 * Utility functions
 */
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Initialize app
 */
function init() {
    // Focus on textarea when page loads
    conversationInput.focus();

    // Add sample conversation if empty (for demo purposes)
    if (!conversationInput.value) {
        conversationInput.value = `Alice: I can't believe you did that.
Bob: What do you mean?
Alice: You know exactly what I mean.
Bob: I was just trying to help...`;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
