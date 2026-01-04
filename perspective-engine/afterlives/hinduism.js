/**
 * Hinduism Afterlife Module
 *
 * Implements two Hindu perspectives on death:
 * 1. Reincarnation (Samsara) - Soul reborn in a new body based on karma
 * 2. Moksha - Liberation from the cycle of rebirth; union with Brahman
 *
 * Used by: Perspective Engine
 */

const HinduismReincarnation = {
  metadata: {
    id: 'hinduism-reincarnation',
    name: 'Hinduism - Reincarnation',
    description: 'Soul reborn in a new body based on karma.',
    source: 'https://plato.stanford.edu/entries/hinduism/',
    category: 'religious',
    tradition: 'Hinduism',
    concept: 'Samsara (Reincarnation)'
  },

  getStyles() {
    return `
      /* Hinduism - Reincarnation (Scatter and rebirth cycle) */
      @keyframes reincarnate-scatter {
        0% {
          transform: translate(0, 0) scale(1) rotate(0deg);
          opacity: 1;
          filter: brightness(1) saturate(1);
          box-shadow: 0 0 10px rgba(251, 146, 60, 0.5);
        }
        25% {
          transform: translate(calc(var(--scatter-x) * 0.5), calc(var(--scatter-y) * 0.5)) scale(1.2) rotate(90deg);
          opacity: 0.7;
          filter: brightness(2) saturate(1.5);
          box-shadow: 0 0 30px rgba(251, 146, 60, 1);
        }
        50% {
          transform: translate(var(--scatter-x), var(--scatter-y)) scale(0.3) rotate(180deg);
          opacity: 0;
          filter: brightness(3) saturate(2) hue-rotate(90deg);
          box-shadow: 0 0 50px rgba(251, 146, 60, 1), 0 0 100px rgba(251, 191, 36, 0.8);
        }
        75% {
          transform: translate(calc(var(--reborn-x) * 0.5), calc(var(--reborn-y) * 0.5)) scale(0.5) rotate(270deg);
          opacity: 0.5;
          filter: brightness(2) saturate(1.5) hue-rotate(180deg);
          box-shadow: 0 0 30px rgba(251, 146, 60, 0.8);
        }
        100% {
          transform: translate(var(--reborn-x), var(--reborn-y)) scale(1) rotate(360deg);
          opacity: 1;
          filter: brightness(1) saturate(1) hue-rotate(0deg);
          box-shadow: 0 0 10px rgba(251, 146, 60, 0.5);
        }
      }
    `;
  },

  getAnimationClass(dot, userData, isDeathSequence) {
    if (isDeathSequence) {
      return 'animate-[die_0.5s_ease-out_forwards]';
    }
    // Infinite scatter and rebirth cycle
    return 'animate-[reincarnate-scatter_4s_ease-in-out_infinite]';
  },

  getAnimationStyle(dot, userData) {
    // Generate random scatter positions for each dot
    const scatterX = (Math.random() - 0.5) * 400;
    const scatterY = (Math.random() - 0.5) * 400;
    const rebornX = (Math.random() - 0.5) * 200;
    const rebornY = (Math.random() - 0.5) * 200;

    return {
      '--scatter-x': `${scatterX}px`,
      '--scatter-y': `${scatterY}px`,
      '--reborn-x': `${rebornX}px`,
      '--reborn-y': `${rebornY}px`
    };
  },

  getBorderClass() {
    return 'border-orange-500';
  },

  getAtmosphereClass() {
    return ''; // No special atmosphere
  },

  init() {
    console.log('Hinduism (Reincarnation) module initialized');
  },

  reset() {
    console.log('Hinduism (Reincarnation) module reset');
  }
};

const HinduismMoksha = {
  metadata: {
    id: 'hinduism-moksha',
    name: 'Hinduism - Moksha',
    description: 'Liberation from the cycle of rebirth; union with Brahman.',
    source: 'https://plato.stanford.edu/entries/hinduism/',
    category: 'religious',
    tradition: 'Hinduism',
    concept: 'Moksha (Liberation)'
  },

  getStyles() {
    return `
      /* Hinduism - Moksha (Expansion into Brahman) */
      @keyframes moksha-expand {
        0% {
          transform: scale(1);
          opacity: 1;
          filter: blur(0px) brightness(1);
          box-shadow: 0 0 10px rgba(251, 146, 60, 0.5);
        }
        33% {
          transform: scale(2);
          opacity: 0.8;
          filter: blur(5px) brightness(2);
          box-shadow: 0 0 40px rgba(251, 146, 60, 1), 0 0 80px rgba(254, 215, 170, 0.8);
        }
        66% {
          transform: scale(4);
          opacity: 0.4;
          filter: blur(15px) brightness(3);
          box-shadow: 0 0 80px rgba(254, 215, 170, 1), 0 0 160px rgba(255, 237, 213, 0.9);
        }
        to {
          transform: scale(6);
          opacity: 0;
          filter: blur(30px) brightness(4);
          box-shadow: 0 0 120px rgba(255, 237, 213, 1), 0 0 240px rgba(255, 251, 235, 0.8);
        }
      }
    `;
  },

  getAnimationClass(dot, userData, isDeathSequence) {
    if (isDeathSequence) {
      return 'animate-[die_0.5s_ease-out_forwards]';
    }
    // Gradual expansion and merging with Brahman
    return 'animate-[moksha-expand_5s_ease-out_forwards]';
  },

  getAnimationStyle(dot, userData) {
    return {};
  },

  getBorderClass() {
    return 'border-orange-400';
  },

  getAtmosphereClass() {
    return ''; // No special atmosphere
  },

  init() {
    console.log('Hinduism (Moksha) module initialized');
  },

  reset() {
    console.log('Hinduism (Moksha) module reset');
  }
};

// Export a combined module that includes both perspectives
export default {
  reincarnation: HinduismReincarnation,
  moksha: HinduismMoksha,

  // For backward compatibility, default to reincarnation
  ...HinduismReincarnation,

  // Override metadata to show both are available
  metadata: {
    id: 'hinduism',
    name: 'Hinduism',
    description: 'Hindu perspectives on death and rebirth',
    source: 'https://plato.stanford.edu/entries/hinduism/',
    category: 'religious',
    tradition: 'Hinduism',
    variants: ['reincarnation', 'moksha']
  }
};
