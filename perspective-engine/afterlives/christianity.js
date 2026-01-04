/**
 * Christianity Afterlife Module
 *
 * Implements three Christian perspectives on death:
 * 1. Heaven - Eternal communion with God in paradise
 * 2. Purgatory - Purification before entering heaven
 * 3. Hell - Separation from God; eternal suffering
 *
 * Used by: Perspective Engine
 */

const ChristianityHeaven = {
  metadata: {
    id: 'christianity-heaven',
    name: 'Christianity - Heaven',
    description: 'Eternal communion with God in paradise.',
    source: 'https://www.britannica.com/topic/Christianity',
    category: 'religious',
    tradition: 'Christianity',
    concept: 'Heaven'
  },

  getStyles() {
    return `
      /* Christianity - Heaven (Rising to eternal paradise) */
      @keyframes rise-to-heaven {
        0% {
          transform: translateY(0) scale(1);
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          box-shadow: 0 0 10px rgba(251, 191, 36, 0.4);
          filter: brightness(1);
        }
        50% {
          transform: translateY(-150px) scale(1.3);
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          box-shadow: 0 0 40px rgba(251, 191, 36, 1), 0 0 80px rgba(254, 243, 199, 0.8);
          filter: brightness(2);
        }
        to {
          transform: translateY(-300px) scale(1.5);
          background: radial-gradient(circle, #ffffff, #fef3c7);
          box-shadow: 0 0 60px rgba(255, 255, 255, 1), 0 0 120px rgba(251, 191, 36, 0.9), 0 0 180px rgba(254, 243, 199, 0.6);
          filter: brightness(3);
        }
      }

      .atmosphere-heaven {
        background: linear-gradient(to br, rgb(120, 53, 15), rgb(251, 191, 36), rgb(17, 24, 39)) !important;
        transition: background 2s ease-in-out;
      }
    `;
  },

  getAnimationClass(dot, userData, isDeathSequence) {
    if (isDeathSequence) {
      return 'animate-[die_0.5s_ease-out_forwards]';
    }
    // Ascend to heaven
    return 'animate-[rise-to-heaven_3s_ease-out_forwards]';
  },

  getAnimationStyle(dot, userData) {
    return {};
  },

  getBorderClass() {
    return 'border-yellow-500';
  },

  getAtmosphereClass() {
    return 'atmosphere-heaven';
  },

  init() {
    console.log('Christianity (Heaven) module initialized');
  },

  reset() {
    console.log('Christianity (Heaven) module reset');
  }
};

const ChristianityPurgatory = {
  metadata: {
    id: 'christianity-purgatory',
    name: 'Christianity - Purgatory',
    description: 'Purification before entering heaven.',
    source: 'https://www.britannica.com/topic/purgatory',
    category: 'religious',
    tradition: 'Christianity',
    concept: 'Purgatory'
  },

  getStyles() {
    return `
      /* Christianity - Purgatory (Purification process) */
      @keyframes purgatory-purify {
        0%, 100% {
          background-color: rgb(75 85 99 / 0.6);
          filter: brightness(1);
          box-shadow: 0 0 5px rgba(75, 85, 99, 0.3);
        }
        25% {
          background: linear-gradient(135deg, #9ca3af, #d1d5db);
          filter: brightness(1.5);
          box-shadow: 0 0 20px rgba(209, 213, 219, 0.7);
        }
        50% {
          background: linear-gradient(135deg, #ffffff, #f3f4f6);
          filter: brightness(2.5);
          box-shadow: 0 0 40px rgba(255, 255, 255, 1);
        }
        75% {
          background: linear-gradient(135deg, #d1d5db, #9ca3af);
          filter: brightness(1.5);
          box-shadow: 0 0 20px rgba(209, 213, 219, 0.7);
        }
      }

      .atmosphere-heaven {
        background: linear-gradient(to br, rgb(120, 53, 15), rgb(251, 191, 36), rgb(17, 24, 39)) !important;
        transition: background 2s ease-in-out;
      }
    `;
  },

  getAnimationClass(dot, userData, isDeathSequence) {
    if (isDeathSequence) {
      return 'animate-[die_0.5s_ease-out_forwards]';
    }
    // Infinite purification cycle
    return 'animate-[purgatory-purify_2s_ease-in-out_infinite]';
  },

  getAnimationStyle(dot, userData) {
    return {};
  },

  getBorderClass() {
    return 'border-yellow-500';
  },

  getAtmosphereClass() {
    return 'atmosphere-heaven';
  },

  init() {
    console.log('Christianity (Purgatory) module initialized');
  },

  reset() {
    console.log('Christianity (Purgatory) module reset');
  }
};

const ChristianityHell = {
  metadata: {
    id: 'christianity-hell',
    name: 'Christianity - Hell',
    description: 'Separation from God; eternal suffering.',
    source: 'https://www.britannica.com/topic/hell-Christianity',
    category: 'religious',
    tradition: 'Christianity',
    concept: 'Hell'
  },

  getStyles() {
    return `
      /* Christianity - Hell (Descent into eternal suffering) */
      @keyframes descend-to-hell {
        0% {
          transform: translateY(0) scale(1) rotate(0deg);
          background: linear-gradient(135deg, #7f1d1d, #991b1b);
          box-shadow: 0 0 10px rgba(127, 29, 29, 0.5);
          filter: brightness(1);
        }
        50% {
          transform: translateY(150px) scale(0.8) rotate(180deg);
          background: linear-gradient(135deg, #991b1b, #7f1d1d);
          box-shadow: 0 0 30px rgba(220, 38, 38, 0.9), 0 0 60px rgba(185, 28, 28, 0.7);
          filter: brightness(1.5);
        }
        to {
          transform: translateY(300px) scale(0.6) rotate(360deg);
          background: radial-gradient(circle, #450a0a, #7f1d1d);
          box-shadow: 0 0 50px rgba(220, 38, 38, 1), 0 0 100px rgba(127, 29, 29, 0.8);
          filter: brightness(0.8) contrast(1.5);
        }
      }

      .atmosphere-hell {
        background: linear-gradient(to br, rgb(0, 0, 0), rgb(127, 29, 29), rgb(0, 0, 0)) !important;
        transition: background 2s ease-in-out;
      }
    `;
  },

  getAnimationClass(dot, userData, isDeathSequence) {
    if (isDeathSequence) {
      return 'animate-[die_0.5s_ease-out_forwards]';
    }
    // Descend to hell
    return 'animate-[descend-to-hell_3s_ease-out_forwards]';
  },

  getAnimationStyle(dot, userData) {
    return {};
  },

  getBorderClass() {
    return 'border-red-500';
  },

  getAtmosphereClass() {
    return 'atmosphere-hell';
  },

  init() {
    console.log('Christianity (Hell) module initialized');
  },

  reset() {
    console.log('Christianity (Hell) module reset');
  }
};

// Export a combined module that includes all three perspectives
export default {
  heaven: ChristianityHeaven,
  purgatory: ChristianityPurgatory,
  hell: ChristianityHell,

  // For backward compatibility, default to heaven
  ...ChristianityHeaven,

  // Override metadata to show all three are available
  metadata: {
    id: 'christianity',
    name: 'Christianity',
    description: 'Christian perspectives on afterlife',
    source: 'https://www.britannica.com/topic/Christianity',
    category: 'religious',
    tradition: 'Christianity',
    variants: ['heaven', 'purgatory', 'hell']
  }
};
