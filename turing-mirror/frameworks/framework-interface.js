/**
 * Consciousness Testing Framework Interface
 *
 * This defines the contract that ALL consciousness testing frameworks must follow.
 * Each framework should implement this interface to ensure consistency and
 * interoperability within The Turing Mirror.
 */

/**
 * Test subject structure
 * @typedef {Object} Subject
 * @property {string} type - Type of subject ('human', 'ai', 'animal', 'system')
 * @property {Object} data - Subject-specific data for testing
 * @property {string} name - Display name of the subject
 */

/**
 * Test result structure
 * @typedef {Object} TestResult
 * @property {number} score - Consciousness likelihood score (0-100)
 * @property {string} interpretation - Human-readable interpretation
 * @property {Object} details - Framework-specific detailed results
 * @property {number} confidence - Confidence in the result (0-100)
 */

/**
 * Base Framework Interface
 * Every consciousness testing framework should export an object matching this structure
 */
export const FrameworkInterface = {
  /**
   * Metadata about this consciousness testing framework
   */
  metadata: {
    id: 'example',                    // Unique identifier (kebab-case)
    name: 'Example Framework',        // Display name
    shortName: 'EF',                  // Abbreviated name for compact displays
    description: 'What this framework tests for...',
    source: 'https://...',            // Academic/reference source
    category: 'computational',        // 'computational', 'behavioral', 'neural', 'philosophical'
    author: 'Researcher Name',        // Original theorist/researcher
    year: 2024                        // Year proposed/published
  },

  /**
   * Run the consciousness test on a subject
   * @param {Subject} subject - The subject to test
   * @returns {TestResult} The test results
   */
  async runTest(subject) {
    // Implement test logic here
    return {
      score: 50,
      interpretation: 'Unclear evidence of consciousness',
      details: {},
      confidence: 50
    };
  },

  /**
   * Get visualization configuration for this framework's results
   * @param {TestResult} result - The test result to visualize
   * @returns {Object} Visualization configuration
   */
  getVisualization(result) {
    return {
      type: 'bar',  // 'bar', 'gauge', 'network', 'scatter', 'radar'
      config: {}    // Visualization-specific configuration
    };
  },

  /**
   * Get interpretation thresholds for score ranges
   * @returns {Array<{min: number, max: number, label: string, color: string}>}
   */
  getThresholds() {
    return [
      { min: 0, max: 25, label: 'Unlikely conscious', color: 'red' },
      { min: 25, max: 50, label: 'Unclear', color: 'yellow' },
      { min: 50, max: 75, label: 'Possibly conscious', color: 'blue' },
      { min: 75, max: 100, label: 'Likely conscious', color: 'green' }
    ];
  },

  /**
   * Get educational content explaining this framework
   * @returns {Object} Educational content
   */
  getEducation() {
    return {
      summary: 'Brief overview...',
      whatItMeasures: 'Explanation of what this framework tests...',
      strengths: 'Why this approach is useful...',
      limitations: 'What this framework cannot tell us...',
      controversy: 'Current scientific debate...'
    };
  },

  /**
   * Initialize this framework (setup, load resources, etc.)
   * Called once when the framework is loaded
   */
  async init() {
    // Optional: Setup code, preload assets, etc.
  },

  /**
   * Reset this framework to initial state
   * Called when user changes subjects or resets
   */
  reset() {
    // Optional: Cleanup code
  }
};

/**
 * Helper function to validate a framework module
 * @param {Object} module - The module to validate
 * @returns {boolean} Whether the module is valid
 */
export function validateFramework(module) {
  const required = ['metadata', 'runTest', 'getVisualization', 'getThresholds', 'getEducation'];
  return required.every(prop => prop in module);
}
