/**
 * Buddhism Afterlife Module
 *
 * Implements two Buddhist perspectives on death:
 * 1. Rebirth (Samsara) - Consciousness dissolves and reforms in a new existence based on karma
 * 2. Nirvana - Liberation from the cycle of rebirth; merging with ultimate reality
 *
 * Used by: Perspective Engine
 */

const BuddhismRebirth = {
  metadata: {
    id: 'buddhism-rebirth',
    name: 'Buddhism - Rebirth',
    description: 'Consciousness dissolves and reforms in a new existence based on karma.',
    source: 'https://plato.stanford.edu/entries/buddhism/',
    category: 'religious',
    tradition: 'Buddhism',
    concept: 'Samsara'
  },

  getStyles() {
    return `
      /* Buddhism - Dissolve and Flow (Rebirth/Samsara) */
      @keyframes buddhist-dissolve {
        0% {
          opacity: 1;
          transform: translateY(0) scale(1) rotate(0deg);
          filter: brightness(1) hue-rotate(0deg);
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.6);
        }
        33% {
          opacity: 0.4;
          transform: translateY(15px) scale(0.6) rotate(120deg);
          filter: brightness(1.5) hue-rotate(60deg);
          box-shadow: 0 0 25px rgba(147, 197, 253, 0.8);
        }
        66% {
          opacity: 0.2;
          transform: translateY(5px) scale(0.3) rotate(240deg);
          filter: brightness(2) hue-rotate(120deg);
          box-shadow: 0 0 35px rgba(191, 219, 254, 1);
        }
        100% {
          opacity: 1;
          transform: translateY(0) scale(1) rotate(360deg);
          filter: brightness(1) hue-rotate(360deg);
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.6);
        }
      }
    `;
  },

  getAnimationClass(dot, userData, isDeathSequence) {
    if (isDeathSequence) {
      return 'animate-[die_0.5s_ease-out_forwards]';
    }
    // Infinite dissolution and reformation cycle
    return 'animate-[buddhist-dissolve_3s_ease-in-out_infinite]';
  },

  getAnimationStyle(dot, userData) {
    return {};
  },

  getBorderClass() {
    return 'border-blue-500';
  },

  getAtmosphereClass() {
    return ''; // No special atmosphere
  },

  init() {
    console.log('Buddhism (Rebirth) module initialized');
  },

  reset() {
    console.log('Buddhism (Rebirth) module reset');
  }
};

const BuddhismNirvana = {
  metadata: {
    id: 'buddhism-nirvana',
    name: 'Buddhism - Nirvana',
    description: 'Liberation from the cycle of rebirth; merging with the ultimate reality.',
    source: 'https://plato.stanford.edu/entries/buddhism/',
    category: 'religious',
    tradition: 'Buddhism',
    concept: 'Nirvana'
  },

  getStyles() {
    return `
      /* Buddhism - Nirvana (Liberation/Merging) */
      @keyframes nirvana-merge {
        0% {
          opacity: 1;
          transform: scale(1);
          filter: blur(0px) brightness(1);
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }
        50% {
          opacity: 0.7;
          transform: scale(2.5);
          filter: blur(8px) brightness(2);
          box-shadow: 0 0 40px rgba(147, 197, 253, 1), 0 0 80px rgba(191, 219, 254, 0.8);
        }
        to {
          opacity: 0;
          transform: scale(4);
          filter: blur(20px) brightness(3);
          box-shadow: 0 0 60px rgba(191, 219, 254, 1), 0 0 120px rgba(224, 242, 254, 0.9);
        }
      }
    `;
  },

  getAnimationClass(dot, userData, isDeathSequence) {
    if (isDeathSequence) {
      return 'animate-[die_0.5s_ease-out_forwards]';
    }
    // Gradual expansion and dissolution into the void
    return 'animate-[nirvana-merge_4s_ease-out_forwards]';
  },

  getAnimationStyle(dot, userData) {
    return {};
  },

  getBorderClass() {
    return 'border-blue-400';
  },

  getAtmosphereClass() {
    return ''; // No special atmosphere
  },

  init() {
    console.log('Buddhism (Nirvana) module initialized');
  },

  reset() {
    console.log('Buddhism (Nirvana) module reset');
  }
};

// Export a combined module that includes both perspectives
export default {
  rebirth: BuddhismRebirth,
  nirvana: BuddhismNirvana,

  // For backward compatibility, default to rebirth
  ...BuddhismRebirth,

  // Override metadata to show both are available
  metadata: {
    id: 'buddhism',
    name: 'Buddhism',
    description: 'Buddhist perspectives on death and rebirth',
    source: 'https://plato.stanford.edu/entries/buddhism/',
    category: 'religious',
    tradition: 'Buddhism',
    variants: ['rebirth', 'nirvana']
  }
};
