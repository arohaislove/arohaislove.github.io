/**
 * Judaism Afterlife Module
 *
 * Implements the Jewish perspective on death:
 * Rest in Sheol - A peaceful resting state awaiting the World to Come
 *
 * Used by: Perspective Engine
 */

export default {
  metadata: {
    id: 'judaism',
    name: 'Judaism - Rest',
    description: 'Peaceful rest in Sheol, awaiting the World to Come.',
    source: 'https://www.britannica.com/topic/Judaism',
    category: 'religious',
    tradition: 'Judaism',
    concept: 'Sheol / Olam Ha-Ba'
  },

  getStyles() {
    return `
      /* Judaism - Peaceful Rest */
      @keyframes judaic-rest {
        to {
          box-shadow: 0 0 8px rgba(251, 191, 36, 0.4);
          filter: brightness(1.2);
        }
      }
    `;
  },

  getAnimationClass(dot, userData, isDeathSequence) {
    if (isDeathSequence) {
      return 'animate-[die_0.5s_ease-out_forwards]';
    }
    // Gentle brightening to represent peaceful rest
    return 'animate-[judaic-rest_2s_ease-out_forwards]';
  },

  getAnimationStyle(dot, userData) {
    return {};
  },

  getBorderClass() {
    return 'border-yellow-600';
  },

  getAtmosphereClass() {
    return ''; // No special atmosphere
  },

  init() {
    console.log('Judaism module initialized');
  },

  reset() {
    console.log('Judaism module reset');
  }
};
