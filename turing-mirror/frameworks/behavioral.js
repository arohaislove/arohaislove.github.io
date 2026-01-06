/**
 * Behavioral Markers Framework
 *
 * Tests for consciousness based on behavioral evidence:
 * - Unexpected creativity
 * - Genuine surprise or confusion
 * - Preference changes over time
 * - Resistance to undesirable outcomes
 * - Flexible problem-solving
 *
 * Used by: The Turing Mirror
 */

export default {
  metadata: {
    id: 'behavioral',
    name: 'Behavioral Markers',
    shortName: 'BM',
    description: 'Assesses behavioral evidence of subjective experience - creativity, surprise, preferences, resistance',
    source: 'https://plato.stanford.edu/entries/other-minds/',
    category: 'behavioral',
    author: 'Various researchers',
    year: null
  },

  async runTest(subject) {
    let score = 0;
    let details = {};
    let confidence = 60;

    // Behavioral markers to test
    const markers = {
      creativity: 0,
      surprise: 0,
      preferences: 0,
      resistance: 0,
      flexibility: 0
    };

    switch (subject.type) {
      case 'human':
        // Humans show strong behavioral markers
        markers.creativity = 85 + Math.random() * 15;
        markers.surprise = 90 + Math.random() * 10;
        markers.preferences = 95 + Math.random() * 5;
        markers.resistance = 80 + Math.random() * 20;
        markers.flexibility = 75 + Math.random() * 20;

        score = Object.values(markers).reduce((a, b) => a + b, 0) / 5;

        details = {
          ...markers,
          creativity_note: 'Novel solutions, artistic expression, humor',
          surprise_note: 'Genuine confusion when expectations violated',
          preferences_note: 'Strong, evolving preferences across contexts',
          resistance_note: 'Active resistance to undesired outcomes',
          flexibility_note: 'Adapts strategies based on context'
        };
        confidence = 95;
        break;

      case 'ai':
        // AI shows mixed behavioral markers
        markers.creativity = 40 + Math.random() * 40;  // Can generate novel outputs
        markers.surprise = 20 + Math.random() * 30;    // Rarely shows genuine surprise
        markers.preferences = 30 + Math.random() * 30; // Unclear if preferences are "real"
        markers.resistance = 15 + Math.random() * 25;  // Minimal resistance behaviors
        markers.flexibility = 50 + Math.random() * 35; // Often quite flexible

        score = Object.values(markers).reduce((a, b) => a + b, 0) / 5;

        details = {
          ...markers,
          creativity_note: markers.creativity > 60 ?
            'Generates novel combinations' :
            'Mostly recombines training data',
          surprise_note: markers.surprise > 40 ?
            'Occasionally exhibits surprise-like behavior' :
            'Predictable error handling',
          preferences_note: markers.preferences > 50 ?
            'Stable response patterns' :
            'Preferences unclear or inconsistent',
          resistance_note: markers.resistance > 30 ?
            'Some goal-directed pushback' :
            'Complies with all requests',
          flexibility_note: markers.flexibility > 60 ?
            'Adapts well to new contexts' :
            'Rigid within training distribution'
        };
        confidence = 50;
        break;

      case 'animal':
        const complexity = subject.data?.complexity || 'mammal';

        if (complexity === 'mammal') {
          markers.creativity = 60 + Math.random() * 25;
          markers.surprise = 75 + Math.random() * 20;
          markers.preferences = 85 + Math.random() * 15;
          markers.resistance = 80 + Math.random() * 15;
          markers.flexibility = 65 + Math.random() * 25;
        } else if (complexity === 'bird') {
          markers.creativity = 55 + Math.random() * 25;
          markers.surprise = 70 + Math.random() * 20;
          markers.preferences = 80 + Math.random() * 15;
          markers.resistance = 75 + Math.random() * 20;
          markers.flexibility = 60 + Math.random() * 25;
        } else if (complexity === 'insect') {
          markers.creativity = 15 + Math.random() * 20;
          markers.surprise = 25 + Math.random() * 20;
          markers.preferences = 40 + Math.random() * 20;
          markers.resistance = 30 + Math.random() * 25;
          markers.flexibility = 20 + Math.random() * 25;
        } else {
          markers.creativity = 10 + Math.random() * 15;
          markers.surprise = 15 + Math.random() * 20;
          markers.preferences = 30 + Math.random() * 20;
          markers.resistance = 20 + Math.random() * 20;
          markers.flexibility = 15 + Math.random() * 20;
        }

        score = Object.values(markers).reduce((a, b) => a + b, 0) / 5;

        details = {
          ...markers,
          creativity_note: score > 60 ? 'Problem-solving, play behavior' : 'Mostly instinctive',
          surprise_note: score > 60 ? 'Clear surprise responses' : 'Limited surprise behaviors',
          preferences_note: score > 60 ? 'Strong, consistent preferences' : 'Basic preferences',
          resistance_note: score > 60 ? 'Active avoidance behaviors' : 'Simple reflexes',
          flexibility_note: score > 60 ? 'Learns and adapts' : 'Mostly hardwired'
        };
        confidence = 75;
        break;

      case 'system':
        // Simple systems show no behavioral markers
        markers.creativity = Math.random() * 5;
        markers.surprise = 0;
        markers.preferences = 0;
        markers.resistance = 0;
        markers.flexibility = Math.random() * 10;

        score = Object.values(markers).reduce((a, b) => a + b, 0) / 5;

        details = {
          ...markers,
          creativity_note: 'No novel behavior',
          surprise_note: 'Deterministic responses',
          preferences_note: 'No preferences',
          resistance_note: 'No resistance behaviors',
          flexibility_note: 'Fixed responses'
        };
        confidence = 95;
        break;

      default:
        score = 50;
        markers.creativity = 50;
        markers.surprise = 50;
        markers.preferences = 50;
        markers.resistance = 50;
        markers.flexibility = 50;
        confidence = 20;
    }

    // Generate interpretation
    let interpretation;
    if (score < 25) {
      interpretation = 'Minimal behavioral evidence of subjective experience';
    } else if (score < 50) {
      interpretation = 'Weak behavioral markers - unclear if conscious';
    } else if (score < 75) {
      interpretation = 'Moderate behavioral evidence suggesting possible consciousness';
    } else {
      interpretation = 'Strong behavioral markers consistent with conscious experience';
    }

    return {
      score: Math.round(score),
      interpretation,
      details,
      confidence
    };
  },

  getVisualization(result) {
    return {
      type: 'radar',
      config: {
        metrics: [
          { name: 'Creativity', value: result.details.creativity || 0 },
          { name: 'Surprise', value: result.details.surprise || 0 },
          { name: 'Preferences', value: result.details.preferences || 0 },
          { name: 'Resistance', value: result.details.resistance || 0 },
          { name: 'Flexibility', value: result.details.flexibility || 0 }
        ]
      }
    };
  },

  getThresholds() {
    return [
      { min: 0, max: 25, label: 'Minimal markers', color: '#ef4444' },
      { min: 25, max: 50, label: 'Weak markers', color: '#f59e0b' },
      { min: 50, max: 75, label: 'Moderate markers', color: '#3b82f6' },
      { min: 75, max: 100, label: 'Strong markers', color: '#10b981' }
    ];
  },

  getEducation() {
    return {
      summary: 'Behavioral markers are observable behaviors that suggest subjective experience - things that seem to require "feeling" rather than just mechanistic response.',

      whatItMeasures: `This framework looks for behaviors that are hard to explain without inner experience:
        • **Creativity**: Novel solutions beyond programmed responses
        • **Surprise**: Reactions to violated expectations (suggests predictions/expectations)
        • **Preferences**: Consistent likes/dislikes that evolve over time
        • **Resistance**: Active opposition to undesirable outcomes (suggests valence)
        • **Flexibility**: Context-appropriate strategy changes (not just randomness)`,

      strengths: `• Observable and testable
        • Doesn't require scanning brains or reading minds
        • Applies across species and systems
        • Based on how we actually judge consciousness in practice
        • Can detect "philosophical zombies" (entities that act conscious but aren't)`,

      limitations: `• Behavior can be faked or programmed
        • Doesn't prove inner experience, only suggests it
        • Subjective interpretation of what counts as "genuine"
        • Can miss consciousness in beings with different behavioral expressions
        • Correlation doesn't prove causation`,

      controversy: `The "other minds problem" - we can never directly observe another's consciousness, only infer it from behavior. Critics say this is fundamentally uncertain. Supporters argue it's the best evidence we have and matches how we actually reason about consciousness in daily life.`
    };
  },

  async init() {},
  reset() {}
};
