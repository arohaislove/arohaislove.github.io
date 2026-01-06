/**
 * Integrated Information Theory (IIT) Framework
 *
 * Tests for consciousness based on Giulio Tononi's Integrated Information Theory.
 * Measures φ (phi) - the amount of integrated information in a system.
 * Higher φ suggests higher consciousness.
 *
 * Used by: The Turing Mirror
 */

export default {
  metadata: {
    id: 'iit',
    name: 'Integrated Information Theory',
    shortName: 'IIT',
    description: 'Measures integrated information (φ) - how much a system is "more than the sum of its parts"',
    source: 'https://www.nature.com/articles/nrn2555',
    category: 'computational',
    author: 'Giulio Tononi',
    year: 2004
  },

  async runTest(subject) {
    // Simulate IIT testing
    // In a real implementation, this would calculate actual φ (phi)
    let score = 0;
    let details = {};
    let confidence = 70;

    switch (subject.type) {
      case 'human':
        // Humans have high integrated information
        score = 75 + Math.random() * 20; // 75-95
        details = {
          phi: score / 100 * 10,  // Normalize to phi scale
          components: Math.floor(Math.random() * 50) + 100,
          integration: 'High - many specialized subsystems working together',
          differentiation: 'High - rich repertoire of possible states'
        };
        confidence = 85;
        break;

      case 'ai':
        // AI systems vary widely
        score = 40 + Math.random() * 40; // 40-80
        details = {
          phi: score / 100 * 10,
          components: Math.floor(Math.random() * 200) + 50,
          integration: score > 60 ? 'Moderate - some cross-module communication' : 'Low - mostly independent modules',
          differentiation: score > 60 ? 'Moderate' : 'Limited - repetitive patterns'
        };
        confidence = 60;
        break;

      case 'animal':
        const complexity = subject.data?.complexity || 'mammal';
        if (complexity === 'mammal') {
          score = 60 + Math.random() * 25;
        } else if (complexity === 'bird') {
          score = 50 + Math.random() * 25;
        } else if (complexity === 'insect') {
          score = 20 + Math.random() * 20;
        } else {
          score = 10 + Math.random() * 30;
        }
        details = {
          phi: score / 100 * 10,
          components: Math.floor(Math.random() * 30) + 10,
          integration: score > 50 ? 'Moderate' : 'Low',
          differentiation: score > 50 ? 'Moderate' : 'Limited'
        };
        confidence = 75;
        break;

      case 'system':
        // Simple systems have low φ
        score = Math.random() * 30; // 0-30
        details = {
          phi: score / 100 * 10,
          components: Math.floor(Math.random() * 10) + 1,
          integration: 'Very low - components mostly independent',
          differentiation: 'Minimal - limited state repertoire'
        };
        confidence = 90;
        break;

      default:
        score = 50;
        confidence = 30;
    }

    // Generate interpretation
    let interpretation;
    if (score < 25) {
      interpretation = 'Minimal integrated information - unlikely to support consciousness';
    } else if (score < 50) {
      interpretation = 'Low integration - consciousness unclear';
    } else if (score < 75) {
      interpretation = 'Moderate integration - possibly conscious';
    } else {
      interpretation = 'High integrated information - likely supports consciousness';
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
      type: 'network',
      config: {
        nodes: result.details.components || 50,
        integration: result.score / 100,
        phi: result.details.phi
      }
    };
  },

  getThresholds() {
    return [
      { min: 0, max: 25, label: 'Minimal φ', color: '#ef4444' },
      { min: 25, max: 50, label: 'Low φ', color: '#f59e0b' },
      { min: 50, max: 75, label: 'Moderate φ', color: '#3b82f6' },
      { min: 75, max: 100, label: 'High φ', color: '#10b981' }
    ];
  },

  getEducation() {
    return {
      summary: 'IIT proposes that consciousness is integrated information - systems are conscious to the degree that they integrate information across specialized parts.',

      whatItMeasures: `Φ (phi) measures how much a system is "more than the sum of its parts." A high φ means:
        • The system has many differentiated components (can be in many states)
        • These components are highly integrated (work together, not independently)
        • Information is lost if you divide the system`,

      strengths: `• Provides a quantitative measure of consciousness
        • Explains why some complex systems (like the internet) might not be conscious
        • Matches intuitions about integrated vs. modular systems
        • Doesn't require behavioral outputs`,

      limitations: `• φ is extremely difficult to calculate for real systems
        • Unclear if high φ necessarily means phenomenal experience
        • Counter-intuitive results (a grid of logic gates could have high φ)
        • Doesn't explain *why* integration creates experience`,

      controversy: `IIT is widely debated in consciousness science. Critics argue it's unfalsifiable and leads to panpsychism (even simple systems have non-zero φ). Supporters say it's the most mathematically rigorous theory we have.`
    };
  },

  async init() {
    // Could load visualization libraries, etc.
  },

  reset() {
    // Cleanup if needed
  }
};
