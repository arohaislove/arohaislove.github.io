// NZ Policy Matcher - Main Script

// State
let currentQuestionIndex = 0;
let userAnswers = [];

// DOM Elements
const startScreen = document.getElementById('start-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultsScreen = document.getElementById('results-screen');
const startBtn = document.getElementById('start-btn');
const backBtn = document.getElementById('back-btn');
const restartBtn = document.getElementById('restart-btn');
const questionNumber = document.getElementById('question-number');
const categoryTag = document.getElementById('category-tag');
const questionText = document.getElementById('question-text');
const progressFill = document.getElementById('progress-fill');
const answerButtons = document.querySelectorAll('.answer-btn');
const resultsContent = document.getElementById('results-content');
const flipInsights = document.getElementById('flip-insights');

// Event Listeners
startBtn.addEventListener('click', startQuiz);
backBtn.addEventListener('click', previousQuestion);
restartBtn.addEventListener('click', restartQuiz);

answerButtons.forEach(btn => {
    btn.addEventListener('click', () => handleAnswer(parseFloat(btn.dataset.value)));
});

// Functions
function startQuiz() {
    currentQuestionIndex = 0;
    userAnswers = [];
    showScreen('quiz');
    displayQuestion();
}

function showScreen(screen) {
    startScreen.classList.remove('active');
    quizScreen.classList.remove('active');
    resultsScreen.classList.remove('active');

    if (screen === 'start') startScreen.classList.add('active');
    if (screen === 'quiz') quizScreen.classList.add('active');
    if (screen === 'results') resultsScreen.classList.add('active');
}

function displayQuestion() {
    const question = policyQuestions[currentQuestionIndex];

    questionNumber.textContent = `Question ${currentQuestionIndex + 1} of ${policyQuestions.length}`;
    categoryTag.textContent = question.category;
    questionText.textContent = question.question;

    // Update progress bar
    const progress = ((currentQuestionIndex + 1) / policyQuestions.length) * 100;
    progressFill.style.width = `${progress}%`;

    // Show back button if not on first question
    backBtn.style.display = currentQuestionIndex > 0 ? 'block' : 'none';
}

function handleAnswer(value) {
    userAnswers[currentQuestionIndex] = value;

    if (currentQuestionIndex < policyQuestions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    } else {
        // Quiz complete - show results
        calculateResults();
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

function calculateResults() {
    const parties = Object.keys(partyInfo);
    const results = [];

    // Calculate match for each party
    parties.forEach(partyKey => {
        let totalDifference = 0;
        let agreedPolicies = [];
        let disagreedPolicies = [];

        policyQuestions.forEach((question, index) => {
            const userAnswer = userAnswers[index];
            const partyPosition = question.positions[partyKey];
            const difference = Math.abs(userAnswer - partyPosition);

            totalDifference += difference;

            // Track agreements and disagreements
            if (difference <= 0.5) {
                agreedPolicies.push(question);
            } else {
                disagreedPolicies.push(question);
            }
        });

        // Calculate match percentage (inverse of average difference)
        const maxPossibleDifference = policyQuestions.length * 2; // Max difference is 2 per question
        const matchPercentage = Math.round(((maxPossibleDifference - totalDifference) / maxPossibleDifference) * 100);

        results.push({
            party: partyKey,
            info: partyInfo[partyKey],
            matchPercentage,
            totalDifference,
            agreedPolicies,
            disagreedPolicies
        });
    });

    // Sort by match percentage
    results.sort((a, b) => b.matchPercentage - a.matchPercentage);

    displayResults(results);
    calculateFlipInsights(results);
}

function displayResults(results) {
    showScreen('results');

    resultsContent.innerHTML = '';

    results.forEach((result, index) => {
        const partyDiv = document.createElement('div');
        partyDiv.className = 'party-result';

        const color = result.info.color;
        const textColor = result.info.textColor || '#ffffff';
        const rank = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

        partyDiv.innerHTML = `
            <div class="party-header">
                <div class="party-name" style="color: ${color}">
                    ${rank} ${result.info.name}
                </div>
                <div class="match-percentage" style="color: ${color}">
                    ${result.matchPercentage}%
                </div>
            </div>
            <div class="party-leader">
                ${result.info.leader || result.info.leaders}
            </div>
            <div class="match-bar-container">
                <div class="match-bar" style="width: ${result.matchPercentage}%; background-color: ${color};">
                    <span class="match-label" style="color: ${textColor};">
                        ${result.matchPercentage}%
                    </span>
                </div>
            </div>
            <div class="agreement-summary">
                You agreed on ${result.agreedPolicies.length} out of ${policyQuestions.length} policies
            </div>
        `;

        resultsContent.appendChild(partyDiv);
    });
}

function calculateFlipInsights(results) {
    flipInsights.innerHTML = '';

    const topMatch = results[0];
    const insights = [];

    // For each other party, find which single question change would maximize their score
    results.slice(1, 4).forEach(otherParty => {
        let bestFlip = null;
        let bestNewScore = otherParty.matchPercentage;

        // Try flipping each answer to match the other party
        policyQuestions.forEach((question, qIndex) => {
            const originalAnswer = userAnswers[qIndex];
            const otherPartyPosition = question.positions[otherParty.party];

            // Only consider if we currently disagree
            const currentDifference = Math.abs(originalAnswer - otherPartyPosition);
            if (currentDifference > 0.5) {
                // Simulate flipping this answer
                const tempAnswers = [...userAnswers];
                tempAnswers[qIndex] = otherPartyPosition;

                // Calculate new score for this party
                const newScore = calculatePartyScore(otherParty.party, tempAnswers);

                if (newScore > bestNewScore) {
                    bestNewScore = newScore;
                    bestFlip = {
                        question: question.question,
                        category: question.category,
                        newScore: newScore,
                        scoreGain: newScore - otherParty.matchPercentage
                    };
                }
            }
        });

        // Check if this flip would make them the top match
        if (bestFlip && bestNewScore > topMatch.matchPercentage) {
            insights.push({
                party: otherParty.info.name,
                color: otherParty.info.color,
                ...bestFlip
            });
        }
    });

    // Display insights
    if (insights.length > 0) {
        insights.forEach(insight => {
            const insightDiv = document.createElement('div');
            insightDiv.className = 'flip-insight';
            insightDiv.innerHTML = `
                <div class="flip-insight-text">
                    <strong style="color: ${insight.color}">${insight.party}</strong> would be your top match
                    (${Math.round(insight.newScore)}%, +${Math.round(insight.scoreGain)}%)
                    if you changed your position on:
                    <br><em>"${insight.question}"</em>
                </div>
            `;
            flipInsights.appendChild(insightDiv);
        });
    } else {
        flipInsights.innerHTML = `
            <div class="flip-insight">
                <div class="flip-insight-text">
                    Your views are quite distinct from other parties.
                    No single policy change would significantly shift your top match.
                </div>
            </div>
        `;
    }
}

function calculatePartyScore(partyKey, answers) {
    let totalDifference = 0;

    policyQuestions.forEach((question, index) => {
        const userAnswer = answers[index];
        const partyPosition = question.positions[partyKey];
        const difference = Math.abs(userAnswer - partyPosition);
        totalDifference += difference;
    });

    const maxPossibleDifference = policyQuestions.length * 2;
    return ((maxPossibleDifference - totalDifference) / maxPossibleDifference) * 100;
}

function restartQuiz() {
    currentQuestionIndex = 0;
    userAnswers = [];
    showScreen('start');
}

// Initialize
showScreen('start');

// Initialize analytics when DOM is ready
if (window.Analytics) {
    Analytics.init();
}
