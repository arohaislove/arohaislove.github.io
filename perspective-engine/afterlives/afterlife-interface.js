/**
 * Afterlife Module Interface
 *
 * This defines the contract that ALL afterlife modules must follow.
 * Each afterlife perspective should implement this interface to ensure
 * consistency and interoperability.
 */

/**
 * Standard dot structure passed to all afterlife modules
 * @typedef {Object} Dot
 * @property {number} index - Dot index in the timeline
 * @property {boolean} isPast - Whether the dot represents a past period
 * @property {boolean} isCurrent - Whether this is the NOW dot
 * @property {boolean} isFuture - Whether the dot represents future time
 * @property {number} size - Dot size in pixels
 * @property {string} healthColor - Base health color (before afterlife transformation)
 */

/**
 * User data passed to afterlife modules
 * @typedef {Object} UserData
 * @property {number} currentAge - Current age in years
 * @property {number} lifeExpectancy - Expected lifespan in years
 * @property {number} currentMonth - Current month index
 * @property {number} totalMonths - Total months in lifespan
 * @property {number} deathMonth - Month of expected death
 */

/**
 * Base Afterlife Module interface
 * Every afterlife module should export an object matching this structure
 */
export const AfterlifeInterface = {
  /**
   * Metadata about this afterlife perspective
   */
  metadata: {
    id: 'example',                    // Unique identifier (kebab-case)
    name: 'Example Afterlife',        // Display name
    description: 'What happens...',   // Brief description
    source: 'https://...',            // Academic/reference source
    category: 'religious',            // 'religious' or 'philosophical'
    tradition: 'Buddhism'             // Parent tradition if applicable
  },

  /**
   * CSS animations and styles for this afterlife
   * @returns {string} CSS string with keyframes and classes
   */
  getStyles() {
    return `
      @keyframes example-animation {
        /* Your animation here */
      }
    `;
  },

  /**
   * Get the animation class for a specific dot
   * @param {Dot} dot - The dot to animate
   * @param {UserData} userData - User timeline data
   * @param {boolean} isDeathSequence - Whether the death sequence is active
   * @returns {string} Tailwind animation class (e.g., 'animate-[example_3s_ease-out]')
   */
  getAnimationClass(dot, userData, isDeathSequence) {
    if (isDeathSequence) {
      return 'animate-[die_0.5s_ease-out_forwards]';
    }
    return 'animate-[example_3s_ease-out_forwards]';
  },

  /**
   * Get inline styles for a specific dot (for dynamic values)
   * @param {Dot} dot - The dot to style
   * @param {UserData} userData - User timeline data
   * @returns {Object} CSS-in-JS style object
   */
  getAnimationStyle(dot, userData) {
    // Return inline styles if needed for random values, CSS variables, etc.
    // Example: { '--scatter-x': '100px', backgroundColor: '#fff' }
    return {};
  },

  /**
   * Get border class for this afterlife (visual indicator)
   * @returns {string} Tailwind border class
   */
  getBorderClass() {
    return 'border-blue-500';
  },

  /**
   * Get atmosphere/background effect class for this afterlife
   * @returns {string} CSS class name for atmospheric effects (optional)
   */
  getAtmosphereClass() {
    return ''; // Optional: 'atmosphere-heaven', 'atmosphere-hell', etc.
  },

  /**
   * Initialize this afterlife module (setup, load resources, etc.)
   * Called once when the module is loaded
   */
  init() {
    // Optional: Setup code, preload assets, etc.
  },

  /**
   * Reset this afterlife module to initial state
   * Called when user changes perspectives or resets
   */
  reset() {
    // Optional: Cleanup code
  }
};

/**
 * Helper function to validate an afterlife module
 * @param {Object} module - The module to validate
 * @returns {boolean} Whether the module is valid
 */
export function validateAfterlifeModule(module) {
  const required = ['metadata', 'getStyles', 'getAnimationClass', 'getBorderClass'];
  return required.every(prop => prop in module);
}
