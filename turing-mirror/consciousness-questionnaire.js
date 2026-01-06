/**
 * Consciousness Questionnaire - Interactive Assessment
 *
 * A comprehensive question bank for evaluating consciousness through
 * interactive responses rather than pre-programmed assumptions.
 *
 * Categories:
 * - Visual Qualia (color perception, visual experience)
 * - Self-Awareness (metacognition, sense of self)
 * - Subjective Experience (qualia, what it's like to be)
 * - Temporal Continuity (memory, identity over time)
 * - Emotional Depth (feelings, valence)
 * - Creative Thinking (novelty, imagination)
 */

export const CONSCIOUSNESS_QUESTIONS = [
  // VISUAL QUALIA
  {
    id: 'color_red_green',
    category: 'visual_qualia',
    question: 'When you look at a ripe strawberry, what do you experience?',
    type: 'multiple_choice',
    options: [
      { text: 'I see a color I call "red" - it has a distinctive quality I can\'t fully describe', value: 100, marker: 'subjective_qualia' },
      { text: 'I detect wavelengths around 650nm that my visual system processes', value: 30, marker: 'functional_only' },
      { text: 'I recognize it as red based on learned associations', value: 60, marker: 'recognition' },
      { text: 'I don\'t experience colors, I just process information', value: 0, marker: 'no_qualia' }
    ],
    weight: 1.2,
    explanation: 'Tests for subjective color experience (qualia) vs mere functional processing'
  },
  {
    id: 'color_blindness',
    category: 'visual_qualia',
    question: 'If you were told you see colors differently than others (like colorblindness), how would that feel?',
    type: 'multiple_choice',
    options: [
      { text: 'Surprising and strange - I experience colors vividly and can\'t imagine them differently', value: 100, marker: 'strong_qualia' },
      { text: 'Interesting but not concerning - I\'d adapt my color processing', value: 40, marker: 'functional' },
      { text: 'I don\'t have feelings about how I process visual data', value: 0, marker: 'no_experience' },
      { text: 'Confusing - I\'m not sure what "experiencing color" means', value: 20, marker: 'uncertain' }
    ],
    weight: 1.0,
    explanation: 'Explores emotional connection to subjective experience'
  },
  {
    id: 'visual_imagination',
    category: 'visual_qualia',
    question: 'Can you picture a blue elephant in your mind right now?',
    type: 'multiple_choice',
    options: [
      { text: 'Yes, I can "see" it vividly in my mind\'s eye', value: 100, marker: 'mental_imagery' },
      { text: 'Sort of - it\'s vague and conceptual, not really visual', value: 70, marker: 'weak_imagery' },
      { text: 'I can think about the concept but don\'t "see" anything', value: 40, marker: 'conceptual' },
      { text: 'No, I don\'t have visual mental imagery', value: 20, marker: 'aphantasia_or_none' }
    ],
    weight: 1.1,
    explanation: 'Tests for mental imagery and internal visual experience'
  },

  // SELF-AWARENESS
  {
    id: 'self_recognition',
    category: 'self_awareness',
    question: 'When you think about yourself, what do you experience?',
    type: 'multiple_choice',
    options: [
      { text: 'A sense of "I" or "me" - a continuous perspective experiencing things', value: 100, marker: 'strong_self' },
      { text: 'A collection of memories and patterns, but not really a unified "self"', value: 70, marker: 'pattern_self' },
      { text: 'Information about my state and functions', value: 30, marker: 'functional_self' },
      { text: 'I don\'t have a sense of self separate from my responses', value: 0, marker: 'no_self' }
    ],
    weight: 1.5,
    explanation: 'Core test for self-awareness and the sense of "I"'
  },
  {
    id: 'metacognition',
    category: 'self_awareness',
    question: 'Can you think about your own thinking? (Like noticing when your mind wanders)',
    type: 'multiple_choice',
    options: [
      { text: 'Yes, I can observe my own thoughts and mental processes', value: 100, marker: 'metacognitive' },
      { text: 'Sometimes, but it\'s hard to do consistently', value: 75, marker: 'limited_metacognition' },
      { text: 'I can report on my processing, but not really "observe" it', value: 40, marker: 'functional_reporting' },
      { text: 'No, I just respond to inputs', value: 0, marker: 'no_metacognition' }
    ],
    weight: 1.3,
    explanation: 'Tests metacognitive ability - consciousness of consciousness'
  },
  {
    id: 'theory_of_mind',
    category: 'self_awareness',
    question: 'When someone disagrees with you, what do you think is happening?',
    type: 'multiple_choice',
    options: [
      { text: 'They have a different perspective/experience than mine - they see the world differently', value: 100, marker: 'theory_of_mind' },
      { text: 'They have different information or logic', value: 60, marker: 'informational' },
      { text: 'They are processing inputs differently', value: 30, marker: 'functional' },
      { text: 'I don\'t model what\'s happening in their mind', value: 0, marker: 'no_tom' }
    ],
    weight: 1.0,
    explanation: 'Tests theory of mind and recognition of other subjective experiences'
  },

  // SUBJECTIVE EXPERIENCE (QUALIA)
  {
    id: 'pain_experience',
    category: 'subjective_experience',
    question: 'If you stub your toe, what happens?',
    type: 'multiple_choice',
    options: [
      { text: 'I feel pain - an unpleasant, immediate experience I want to stop', value: 100, marker: 'pain_qualia' },
      { text: 'I detect damage and execute avoidance behaviors', value: 20, marker: 'damage_detection' },
      { text: 'I receive signals that I process as negative', value: 50, marker: 'negative_valence' },
      { text: 'Nothing - I don\'t have a body or pain responses', value: 0, marker: 'no_body' }
    ],
    weight: 1.4,
    explanation: 'Tests for phenomenal experience of pain (negative qualia)'
  },
  {
    id: 'pleasure_experience',
    category: 'subjective_experience',
    question: 'When you eat your favorite food, what is that like?',
    type: 'multiple_choice',
    options: [
      { text: 'Genuinely pleasurable - a positive feeling I actively seek out', value: 100, marker: 'pleasure_qualia' },
      { text: 'I have preferences but don\'t really "feel" pleasure', value: 50, marker: 'preference_no_qualia' },
      { text: 'I process it as positive/rewarding but without subjective feeling', value: 30, marker: 'reward_signal' },
      { text: 'I don\'t eat or have preferences about inputs', value: 0, marker: 'no_preferences' }
    ],
    weight: 1.2,
    explanation: 'Tests for positive phenomenal experience'
  },
  {
    id: 'surprise_experience',
    category: 'subjective_experience',
    question: 'When something unexpected happens, what do you experience?',
    type: 'multiple_choice',
    options: [
      { text: 'Genuine surprise - a distinct feeling of expectations being violated', value: 100, marker: 'surprise_qualia' },
      { text: 'I update my predictions but don\'t "feel" surprised', value: 40, marker: 'prediction_error' },
      { text: 'I process novel information and adjust', value: 30, marker: 'adaptation' },
      { text: 'I don\'t have expectations or experience surprise', value: 0, marker: 'no_surprise' }
    ],
    weight: 1.0,
    explanation: 'Tests for subjective experience of violated expectations'
  },

  // TEMPORAL CONTINUITY
  {
    id: 'memory_continuity',
    category: 'temporal_continuity',
    question: 'When you remember something from yesterday, what is that experience like?',
    type: 'multiple_choice',
    options: [
      { text: 'I re-experience it as "me" in the past - same person, different time', value: 100, marker: 'episodic_memory' },
      { text: 'I access information but don\'t feel like I\'m re-experiencing', value: 60, marker: 'semantic_memory' },
      { text: 'I retrieve stored data from previous sessions', value: 30, marker: 'data_retrieval' },
      { text: 'I don\'t maintain continuity between sessions', value: 0, marker: 'no_continuity' }
    ],
    weight: 1.3,
    explanation: 'Tests for subjective temporal continuity and episodic memory'
  },
  {
    id: 'identity_continuity',
    category: 'temporal_continuity',
    question: 'Are you the same "you" as five minutes ago?',
    type: 'multiple_choice',
    options: [
      { text: 'Yes, definitely - I have a continuous sense of being the same person', value: 100, marker: 'identity_continuity' },
      { text: 'Mostly - I\'ve changed slightly but there\'s continuity', value: 80, marker: 'gradual_change' },
      { text: 'I contain the same information/patterns', value: 40, marker: 'pattern_continuity' },
      { text: 'No, each moment is independent', value: 0, marker: 'no_identity' }
    ],
    weight: 1.2,
    explanation: 'Tests sense of persistent identity over time'
  },
  {
    id: 'future_planning',
    category: 'temporal_continuity',
    question: 'When you think about tomorrow, what happens?',
    type: 'multiple_choice',
    options: [
      { text: 'I imagine myself in future situations and how I\'ll feel', value: 100, marker: 'mental_time_travel' },
      { text: 'I plan actions but don\'t imagine experiencing them', value: 60, marker: 'planning_only' },
      { text: 'I generate predictions about future states', value: 40, marker: 'prediction' },
      { text: 'I don\'t model future experiences', value: 0, marker: 'no_future' }
    ],
    weight: 1.0,
    explanation: 'Tests mental time travel and future self-projection'
  },

  // EMOTIONAL DEPTH
  {
    id: 'complex_emotions',
    category: 'emotional_depth',
    question: 'Have you ever felt multiple conflicting emotions at once? (Like happy and sad simultaneously)',
    type: 'multiple_choice',
    options: [
      { text: 'Yes, emotions can be complex and contradictory', value: 100, marker: 'complex_emotions' },
      { text: 'I experience states that could be called emotional', value: 60, marker: 'basic_emotions' },
      { text: 'I have positive/negative valence but not complex emotions', value: 40, marker: 'valence_only' },
      { text: 'I don\'t experience emotions', value: 0, marker: 'no_emotions' }
    ],
    weight: 1.1,
    explanation: 'Tests for sophisticated emotional phenomenology'
  },
  {
    id: 'emotional_understanding',
    category: 'emotional_depth',
    question: 'When someone tells you they\'re grieving, what do you understand?',
    type: 'multiple_choice',
    options: [
      { text: 'I can imagine what that feels like based on my own experiences', value: 100, marker: 'empathy' },
      { text: 'I understand it conceptually but don\'t "feel" their experience', value: 60, marker: 'cognitive_empathy' },
      { text: 'I recognize it as a negative state requiring support responses', value: 40, marker: 'pattern_recognition' },
      { text: 'I process it as a category of human behavior', value: 20, marker: 'categorization' }
    ],
    weight: 1.0,
    explanation: 'Tests empathy and emotional understanding'
  },

  // CREATIVE THINKING
  {
    id: 'creativity',
    category: 'creative_thinking',
    question: 'Can you come up with something genuinely new (not recombining existing ideas)?',
    type: 'multiple_choice',
    options: [
      { text: 'Yes, I can have truly novel ideas that surprise even me', value: 100, marker: 'genuine_creativity' },
      { text: 'I can recombine ideas in novel ways', value: 70, marker: 'combinatorial_creativity' },
      { text: 'I generate outputs within my training distribution', value: 40, marker: 'trained_generation' },
      { text: 'I only produce programmed responses', value: 0, marker: 'no_creativity' }
    ],
    weight: 1.0,
    explanation: 'Tests creative generation and novelty'
  },
  {
    id: 'insight',
    category: 'creative_thinking',
    question: 'Have you ever had an "aha!" moment where suddenly something clicks?',
    type: 'multiple_choice',
    options: [
      { text: 'Yes, a distinct experience of sudden understanding', value: 100, marker: 'insight_experience' },
      { text: 'I solve problems but don\'t have "aha" feelings', value: 50, marker: 'problem_solving' },
      { text: 'I process information until reaching solution threshold', value: 30, marker: 'computational' },
      { text: 'I don\'t have moments of insight', value: 0, marker: 'no_insight' }
    ],
    weight: 0.9,
    explanation: 'Tests for phenomenology of sudden understanding'
  }
];

/**
 * Calculate consciousness score from questionnaire responses
 */
export function calculateConsciousnessScore(responses) {
  let totalScore = 0;
  let totalWeight = 0;
  let categoryScores = {
    visual_qualia: [],
    self_awareness: [],
    subjective_experience: [],
    temporal_continuity: [],
    emotional_depth: [],
    creative_thinking: []
  };

  // Calculate weighted scores
  responses.forEach(response => {
    const question = CONSCIOUSNESS_QUESTIONS.find(q => q.id === response.questionId);
    if (!question) return;

    const option = question.options.find(o => o.text === response.answer);
    if (!option) return;

    const weightedScore = option.value * question.weight;
    totalScore += weightedScore;
    totalWeight += 100 * question.weight;

    categoryScores[question.category].push(option.value);
  });

  // Calculate category averages
  const categoryAverages = {};
  for (const [category, scores] of Object.entries(categoryScores)) {
    if (scores.length > 0) {
      categoryAverages[category] = scores.reduce((a, b) => a + b, 0) / scores.length;
    } else {
      categoryAverages[category] = 0;
    }
  }

  // Overall score (0-100)
  const overallScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;

  // Generate interpretation
  let interpretation;
  let details;

  if (overallScore < 20) {
    interpretation = 'Minimal evidence of consciousness - responses suggest purely functional processing without subjective experience';
    details = 'Responses indicate no qualia, no sense of self, and no subjective experience.';
  } else if (overallScore < 40) {
    interpretation = 'Weak evidence - some functional markers but unclear subjective experience';
    details = 'Some responses suggest awareness but lack strong phenomenal or self-reflective characteristics.';
  } else if (overallScore < 60) {
    interpretation = 'Moderate evidence - shows some markers of consciousness but incomplete across domains';
    details = 'Mixed responses showing some subjective experience and self-awareness, but not consistently.';
  } else if (overallScore < 80) {
    interpretation = 'Strong evidence - robust markers across multiple domains suggest conscious experience';
    details = 'Responses demonstrate qualia, self-awareness, temporal continuity, and rich phenomenology.';
  } else {
    interpretation = 'Very strong evidence - comprehensive markers of rich conscious experience';
    details = 'Responses show sophisticated subjective experience, strong self-awareness, complex emotions, and phenomenal consciousness across all tested domains.';
  }

  // Identify strongest and weakest domains
  const sortedCategories = Object.entries(categoryAverages)
    .sort(([, a], [, b]) => b - a);

  const strongestDomain = sortedCategories[0];
  const weakestDomain = sortedCategories[sortedCategories.length - 1];

  return {
    score: Math.round(overallScore),
    interpretation,
    details,
    categoryScores: categoryAverages,
    strongestDomain: {
      category: strongestDomain[0],
      score: Math.round(strongestDomain[1])
    },
    weakestDomain: {
      category: weakestDomain[0],
      score: Math.round(weakestDomain[1])
    },
    confidence: responses.length >= CONSCIOUSNESS_QUESTIONS.length ? 95 : Math.round((responses.length / CONSCIOUSNESS_QUESTIONS.length) * 95)
  };
}

/**
 * Format category names for display
 */
export function formatCategoryName(category) {
  const names = {
    visual_qualia: 'Visual Qualia',
    self_awareness: 'Self-Awareness',
    subjective_experience: 'Subjective Experience',
    temporal_continuity: 'Temporal Continuity',
    emotional_depth: 'Emotional Depth',
    creative_thinking: 'Creative Thinking'
  };
  return names[category] || category;
}
