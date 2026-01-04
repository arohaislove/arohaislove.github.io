/**
 * Islam Afterlife Module
 *
 * Implements two Islamic perspectives on death:
 * 1. Jannah (Paradise) - Eternal bliss in the presence of Allah
 * 2. Jahannam (Hell) - Punishment for those who rejected faith
 *
 * Both include the Barzakh (intermediate state) pause before the afterlife transition.
 *
 * Used by: Perspective Engine
 */

const IslamJannah = {
  metadata: {
    id: 'islam-jannah',
    name: 'Islam - Jannah',
    description: 'Paradise; eternal bliss in the presence of Allah.',
    source: 'https://www.britannica.com/topic/Islam',
    category: 'religious',
    tradition: 'Islam',
    concept: 'Jannah (Paradise)'
  },

  getStyles() {
    return `
      /* Islam - Barzakh (intermediate state before judgment) */
      @keyframes barzakh-pause {
        0%, 50% {
          opacity: 0.5;
          filter: blur(3px);
          box-shadow: 0 0 10px rgba(75, 85, 99, 0.4);
        }
        100% {
          opacity: 1;
          filter: blur(0px);
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.6);
        }
      }

      /* Islam - Jannah (Paradise) */
      @keyframes rise-to-jannah {
        0% {
          transform: translateY(0) scale(1);
          background: linear-gradient(135deg, #10b981, #059669);
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
          filter: brightness(1);
        }
        50% {
          transform: translateY(-125px) scale(1.2);
          background: linear-gradient(135deg, #34d399, #10b981, #fbbf24);
          box-shadow: 0 0 40px rgba(16, 185, 129, 1), 0 0 80px rgba(251, 191, 36, 0.8);
          filter: brightness(2);
        }
        to {
          transform: translateY(-250px) scale(1.4);
          background: radial-gradient(circle, #d1fae5, #34d399, #fde68a);
          box-shadow: 0 0 60px rgba(52, 211, 153, 1), 0 0 120px rgba(251, 191, 36, 0.9), 0 0 180px rgba(209, 250, 229, 0.7);
          filter: brightness(2.5);
        }
      }

      .atmosphere-jannah {
        background: linear-gradient(to br, rgb(6, 78, 59), rgb(16, 185, 129), rgb(17, 24, 39)) !important;
        transition: background 2s ease-in-out;
      }
    `;
  },

  getAnimationClass(dot, userData, isDeathSequence) {
    if (isDeathSequence) {
      return 'animate-[die_0.5s_ease-out_forwards]';
    }
    // Barzakh pause (1s), then rise to Jannah (3s)
    return 'animate-[barzakh-pause_1s_ease-in_forwards,rise-to-jannah_3s_1s_ease-out_forwards]';
  },

  getAnimationStyle(dot, userData) {
    return {};
  },

  getBorderClass() {
    return 'border-green-500';
  },

  getAtmosphereClass() {
    return 'atmosphere-jannah';
  },

  init() {
    console.log('Islam (Jannah) module initialized');
  },

  reset() {
    console.log('Islam (Jannah) module reset');
  }
};

const IslamJahannam = {
  metadata: {
    id: 'islam-jahannam',
    name: 'Islam - Jahannam',
    description: 'Hell; punishment for those who rejected faith.',
    source: 'https://www.britannica.com/topic/Islam',
    category: 'religious',
    tradition: 'Islam',
    concept: 'Jahannam (Hell)'
  },

  getStyles() {
    return `
      /* Islam - Barzakh (intermediate state before judgment) */
      @keyframes barzakh-pause {
        0%, 50% {
          opacity: 0.5;
          filter: blur(3px);
          box-shadow: 0 0 10px rgba(75, 85, 99, 0.4);
        }
        100% {
          opacity: 1;
          filter: blur(0px);
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.6);
        }
      }

      /* Islam - Jahannam (Hell) */
      @keyframes descend-to-jahannam {
        0% {
          transform: translateY(0) scale(1) rotate(0deg);
          background: linear-gradient(135deg, #991b1b, #7f1d1d);
          box-shadow: 0 0 10px rgba(153, 27, 27, 0.5);
          filter: brightness(1);
        }
        50% {
          transform: translateY(150px) scale(0.7) rotate(180deg);
          background: linear-gradient(135deg, #dc2626, #991b1b);
          box-shadow: 0 0 35px rgba(220, 38, 38, 1), 0 0 70px rgba(153, 27, 27, 0.8);
          filter: brightness(1.5) saturate(1.5);
        }
        to {
          transform: translateY(300px) scale(0.5) rotate(360deg);
          background: radial-gradient(circle, #450a0a, #991b1b);
          box-shadow: 0 0 50px rgba(220, 38, 38, 1), 0 0 100px rgba(153, 27, 27, 0.9);
          filter: brightness(0.7) saturate(2) contrast(1.5);
        }
      }

      .atmosphere-jahannam {
        background: linear-gradient(to br, rgb(0, 0, 0), rgb(153, 27, 27), rgb(0, 0, 0)) !important;
        transition: background 2s ease-in-out;
      }
    `;
  },

  getAnimationClass(dot, userData, isDeathSequence) {
    if (isDeathSequence) {
      return 'animate-[die_0.5s_ease-out_forwards]';
    }
    // Barzakh pause (1s), then descend to Jahannam (3s)
    return 'animate-[barzakh-pause_1s_ease-in_forwards,descend-to-jahannam_3s_1s_ease-out_forwards]';
  },

  getAnimationStyle(dot, userData) {
    return {};
  },

  getBorderClass() {
    return 'border-red-500';
  },

  getAtmosphereClass() {
    return 'atmosphere-jahannam';
  },

  init() {
    console.log('Islam (Jahannam) module initialized');
  },

  reset() {
    console.log('Islam (Jahannam) module reset');
  }
};

// Export a combined module that includes both perspectives
export default {
  jannah: IslamJannah,
  jahannam: IslamJahannam,

  // For backward compatibility, default to Jannah
  ...IslamJannah,

  // Override metadata to show both are available
  metadata: {
    id: 'islam',
    name: 'Islam',
    description: 'Islamic perspectives on afterlife',
    source: 'https://www.britannica.com/topic/Islam',
    category: 'religious',
    tradition: 'Islam',
    variants: ['jannah', 'jahannam']
  }
};
