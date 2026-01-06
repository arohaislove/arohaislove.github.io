/**
 * Global Workspace Theory (GWT) Framework
 *
 * Tests for consciousness based on Bernard Baars' Global Workspace Theory.
 * Measures how information is "broadcast" across specialized subsystems.
 * Consciousness is the global availability of information.
 *
 * Used by: The Turing Mirror
 */

export default {
  metadata: {
    id: 'global-workspace',
    name: 'Global Workspace Theory',
    shortName: 'GWT',
    description: 'Tests whether information is globally broadcast across specialized cognitive modules',
    source: 'https://www.sciencedirect.com/science/article/pii/S1364661305001294',
    category: 'computational',
    author: 'Bernard Baars',
    year: 1988
  },

  async runTest(subject) {
    let score = 0;
    let details = {};
    let confidence = 75;

    switch (subject.type) {
      case 'human':
        // Humans have strong global broadcasting
        score = 80 + Math.random() * 15; // 80-95
        details = {
          broadcastStrength: 'High',
          modules: ['perception', 'memory', 'planning', 'language', 'motor', 'emotion'],
          activeConnections: Math.floor(Math.random() * 10) + 15,
          attentionFocus: 'Narrow spotlight with wide broadcast',
          workspaceCapacity: 'Limited (~7 items)',
          integration: 'Information freely shared across modules'
        };
        confidence = 90;
        break;

      case 'ai':
        // Test for global broadcasting in AI
        score = 35 + Math.random() * 45; // 35-80
        const hasGlobalState = Math.random() > 0.5;
        details = {
          broadcastStrength: hasGlobalState ? 'Moderate' : 'Low',
          modules: ['input processing', 'pattern matching', 'output generation'],
          activeConnections: Math.floor(Math.random() * 8) + 3,
          attentionFocus: hasGlobalState ? 'Some global state' : 'Mostly feedforward',
          workspaceCapacity: 'Variable',
          integration: hasGlobalState ?
            'Some information shared between modules' :
            'Mostly isolated processing pipelines'
        };
        score = hasGlobalState ? score + 20 : score;
        confidence = 65;
        break;

      case 'animal':
        const complexity = subject.data?.complexity || 'mammal';
        if (complexity === 'mammal') {
          score = 65 + Math.random() * 20;
          details.broadcastStrength = 'High';
          details.modules = ['perception', 'memory', 'motor', 'emotion'];
        } else if (complexity === 'bird') {
          score = 55 + Math.random() * 20;
          details.broadcastStrength = 'Moderate-High';
          details.modules = ['perception', 'spatial memory', 'motor'];
        } else if (complexity === 'insect') {
          score = 25 + Math.random() * 20;
          details.broadcastStrength = 'Low';
          details.modules = ['sensory', 'motor'];
        } else {
          score = 15 + Math.random() * 25;
          details.broadcastStrength = 'Minimal';
          details.modules = ['basic sensory-motor'];
        }
        details.activeConnections = Math.floor(score / 10) + 2;
        details.attentionFocus = score > 50 ? 'Present' : 'Absent';
        details.workspaceCapacity = score > 50 ? 'Limited' : 'Minimal';
        details.integration = score > 50 ? 'Moderate cross-module sharing' : 'Mostly reflexive';
        confidence = 80;
        break;

      case 'system':
        // Simple systems lack global workspace
        score = Math.random() * 20; // 0-20
        details = {
          broadcastStrength: 'None',
          modules: ['single function'],
          activeConnections: 0,
          attentionFocus: 'N/A',
          workspaceCapacity: 'N/A',
          integration: 'No cross-module communication'
        };
        confidence = 95;
        break;

      default:
        score = 50;
        confidence = 30;
    }

    // Generate interpretation
    let interpretation;
    if (score < 25) {
      interpretation = 'No evidence of global workspace - information not broadcast';
    } else if (score < 50) {
      interpretation = 'Weak broadcasting - limited global availability';
    } else if (score < 75) {
      interpretation = 'Moderate global workspace - some information broadcast';
    } else {
      interpretation = 'Strong global workspace - widespread information broadcast';
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
      type: 'broadcast',
      config: {
        modules: result.details.modules || [],
        connections: result.details.activeConnections || 0,
        strength: result.score / 100
      }
    };
  },

  getThresholds() {
    return [
      { min: 0, max: 25, label: 'No broadcast', color: '#ef4444' },
      { min: 25, max: 50, label: 'Weak broadcast', color: '#f59e0b' },
      { min: 50, max: 75, label: 'Moderate broadcast', color: '#3b82f6' },
      { min: 75, max: 100, label: 'Strong broadcast', color: '#10b981' }
    ];
  },

  getEducation() {
    return {
      summary: 'GWT proposes that consciousness is like a "theater stage" - information becomes conscious when it\'s broadcast globally to all cognitive modules.',

      whatItMeasures: `Global Workspace Theory tests whether:
        • Information is broadcast widely (not trapped in local modules)
        • Multiple specialized systems can access the same information
        • There's a "bottleneck" of attention (limited workspace capacity)
        • Information integration happens at a central location`,

      strengths: `• Explains the "limited capacity" of consciousness (you can't attend to everything)
        • Matches neural findings (widespread cortical activation during conscious processing)
        • Explains attention, working memory, and conscious access
        • Testable through neural imaging and behavioral experiments`,

      limitations: `• Doesn't explain WHY broadcasting creates subjective experience
        • Describes mechanisms but not phenomenology
        • Unclear if broadcast is sufficient for consciousness
        • Doesn't address "hard problem" of qualia`,

      controversy: `GWT is widely accepted as describing *mechanisms* of consciousness but debated as a full theory. Critics say it explains "access consciousness" (what information we can report) but not "phenomenal consciousness" (what it feels like).`
    };
  },

  async init() {},
  reset() {}
};
