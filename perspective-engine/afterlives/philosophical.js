/**
 * Philosophical Afterlife Perspectives Module
 *
 * Implements various philosophical and scientific perspectives on death:
 * 1. Ancestor Traditions - Moving to the past, joining ancestors
 * 2. Analytic Idealism - Dissolving boundaries of individual consciousness
 * 3. Panpsychism - Fragmenting into universal consciousness
 * 4. Illusionism - Consciousness simply switching off
 * 5. Simulation Theory - Reality glitching as the simulation ends
 * 6. Atomic Dispersal - Physical matter drifting apart and transforming
 * 7. Heat Death - Gradual cooling and fading into entropy
 *
 * Used by: Perspective Engine
 */

const AncestorTraditions = {
  metadata: {
    id: 'ancestor',
    name: 'Ancestor Traditions',
    description: 'Joining those who came before; moving into the realm of ancestors.',
    source: 'https://plato.stanford.edu/entries/african-sage/',
    category: 'philosophical',
    tradition: 'African & Indigenous Philosophies'
  },

  getStyles() {
    return `
      /* Ancestor Traditions - Moving to the Past */
      @keyframes move-to-past {
        to {
          transform: translateZ(-100px) translateY(-20px);
          opacity: 0.4;
          filter: blur(2px);
        }
      }
    `;
  },

  getAnimationClass(dot, userData, isDeathSequence) {
    if (isDeathSequence) {
      return 'animate-[die_0.5s_ease-out_forwards]';
    }
    return 'animate-[move-to-past_3s_ease-out_forwards]';
  },

  getAnimationStyle(dot, userData) {
    return {};
  },

  getBorderClass() {
    return 'border-amber-700';
  },

  getAtmosphereClass() {
    return '';
  },

  init() {},
  reset() {}
};

const AnalyticIdealism = {
  metadata: {
    id: 'idealism',
    name: 'Analytic Idealism',
    description: 'Individual consciousness dissolves back into universal mind.',
    source: 'https://plato.stanford.edu/entries/idealism/',
    category: 'philosophical',
    tradition: 'Idealism'
  },

  getStyles() {
    return `
      /* Analytic Idealism - Dissolve Boundaries */
      @keyframes dissolve-boundaries {
        0% {
          border-radius: 20%;
          opacity: 1;
          filter: blur(0px) brightness(1);
          box-shadow: 0 0 10px rgba(168, 85, 247, 0.5);
        }
        33% {
          border-radius: 40%;
          opacity: 0.7;
          filter: blur(4px) brightness(1.5);
          box-shadow: 0 0 30px rgba(168, 85, 247, 0.8), 0 0 60px rgba(192, 132, 252, 0.6);
        }
        66% {
          border-radius: 50%;
          opacity: 0.4;
          filter: blur(12px) brightness(2);
          box-shadow: 0 0 50px rgba(192, 132, 252, 1), 0 0 100px rgba(216, 180, 254, 0.8);
        }
        to {
          border-radius: 50%;
          opacity: 0.1;
          filter: blur(20px) brightness(3);
          box-shadow: 0 0 80px rgba(216, 180, 254, 1), 0 0 160px rgba(233, 213, 255, 0.9);
        }
      }
    `;
  },

  getAnimationClass(dot, userData, isDeathSequence) {
    if (isDeathSequence) {
      return 'animate-[die_0.5s_ease-out_forwards]';
    }
    return 'animate-[dissolve-boundaries_4s_ease-out_forwards]';
  },

  getAnimationStyle(dot, userData) {
    return {};
  },

  getBorderClass() {
    return 'border-purple-500';
  },

  getAtmosphereClass() {
    return '';
  },

  init() {},
  reset() {}
};

const Panpsychism = {
  metadata: {
    id: 'panpsychism',
    name: 'Panpsychism',
    description: 'Consciousness fragments and disperses into all matter.',
    source: 'https://plato.stanford.edu/entries/panpsychism/',
    category: 'philosophical',
    tradition: 'Panpsychism'
  },

  getStyles() {
    return `
      /* Panpsychism - Fragment Consciousness */
      @keyframes fragment-consciousness {
        0% {
          transform: translate(0, 0) scale(1);
          opacity: 1;
          filter: brightness(1);
          box-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
        }
        25% {
          transform: translate(calc(var(--fragment-x) * 0.3), calc(var(--fragment-y) * 0.3)) scale(0.8);
          opacity: 0.9;
          filter: brightness(1.5);
          box-shadow: 0 0 20px rgba(96, 165, 250, 0.8);
        }
        50% {
          transform: translate(calc(var(--fragment-x) * 0.6), calc(var(--fragment-y) * 0.6)) scale(0.5);
          opacity: 0.8;
          filter: brightness(2);
          box-shadow: 0 0 30px rgba(147, 197, 253, 1), 0 0 60px rgba(191, 219, 254, 0.7);
        }
        to {
          transform: translate(var(--fragment-x), var(--fragment-y)) scale(0.2);
          opacity: 0.6;
          filter: brightness(2.5);
          box-shadow: 0 0 40px rgba(191, 219, 254, 1), 0 0 80px rgba(224, 242, 254, 0.8);
        }
      }
    `;
  },

  getAnimationClass(dot, userData, isDeathSequence) {
    if (isDeathSequence) {
      return 'animate-[die_0.5s_ease-out_forwards]';
    }
    return 'animate-[fragment-consciousness_3s_ease-out_forwards]';
  },

  getAnimationStyle(dot, userData) {
    const fragmentX = (Math.random() - 0.5) * 600;
    const fragmentY = (Math.random() - 0.5) * 600;
    return {
      '--fragment-x': `${fragmentX}px`,
      '--fragment-y': `${fragmentY}px`
    };
  },

  getBorderClass() {
    return 'border-blue-400';
  },

  getAtmosphereClass() {
    return '';
  },

  init() {},
  reset() {}
};

const Illusionism = {
  metadata: {
    id: 'illusionism',
    name: 'Illusionism',
    description: 'Consciousness is an illusion; death is simply switching off.',
    source: 'https://plato.stanford.edu/entries/consciousness-illusionism/',
    category: 'philosophical',
    tradition: 'Illusionism'
  },

  getStyles() {
    return `
      /* Illusionism - Switch Off */
      @keyframes switch-off {
        0% {
          opacity: 1;
          filter: blur(0px) brightness(1);
          box-shadow: 0 0 5px rgba(75, 85, 99, 0.3);
        }
        30% {
          opacity: 0.7;
          filter: blur(1px) brightness(0.8);
          box-shadow: 0 0 10px rgba(75, 85, 99, 0.4);
        }
        50% {
          opacity: 0.4;
          filter: blur(3px) brightness(0.5);
          box-shadow: 0 0 15px rgba(75, 85, 99, 0.5);
        }
        70% {
          opacity: 0.2;
          filter: blur(5px) brightness(0.3);
          box-shadow: 0 0 10px rgba(75, 85, 99, 0.3);
        }
        100% {
          opacity: 0;
          filter: blur(8px) brightness(0);
          box-shadow: none;
        }
      }
    `;
  },

  getAnimationClass(dot, userData, isDeathSequence) {
    if (isDeathSequence) {
      return 'animate-[die_0.5s_ease-out_forwards]';
    }
    return 'animate-[switch-off_1s_ease-out_forwards]';
  },

  getAnimationStyle(dot, userData) {
    return {};
  },

  getBorderClass() {
    return 'border-gray-500';
  },

  getAtmosphereClass() {
    return '';
  },

  init() {},
  reset() {}
};

const SimulationTheory = {
  metadata: {
    id: 'simulation',
    name: 'Simulation Theory',
    description: 'Reality glitches as your simulation instance terminates.',
    source: 'https://www.simulation-argument.com/',
    category: 'philosophical',
    tradition: 'Simulation Hypothesis'
  },

  getStyles() {
    return `
      /* Simulation Theory - Glitch */
      @keyframes glitch {
        0%, 100% {
          transform: translate(0, 0) scale(1);
          opacity: 1;
          filter: hue-rotate(0deg) saturate(1);
          box-shadow: 0 0 5px rgba(34, 211, 238, 0.5);
        }
        10% {
          transform: translate(-3px, 2px) scale(1.05);
          opacity: 0.9;
          filter: hue-rotate(30deg) saturate(1.5);
          box-shadow: 0 0 15px rgba(34, 211, 238, 0.8), -3px 0 5px rgba(239, 68, 68, 0.5);
        }
        20% {
          transform: translate(3px, -2px) scale(0.95);
          opacity: 0.8;
          filter: hue-rotate(60deg) saturate(2);
          box-shadow: 0 0 20px rgba(34, 211, 238, 1), 3px 0 5px rgba(34, 197, 94, 0.5);
        }
        30% {
          transform: translate(-2px, -3px) scale(1.02);
          opacity: 0.7;
          filter: hue-rotate(90deg) saturate(1.8);
          box-shadow: 0 0 25px rgba(147, 197, 253, 1);
        }
        40% {
          transform: translate(2px, 3px) scale(0.98);
          opacity: 0.6;
          filter: hue-rotate(120deg) saturate(1.5);
          box-shadow: 0 0 20px rgba(34, 211, 238, 0.8);
        }
        50% {
          transform: translate(-4px, 1px) scale(1.08);
          opacity: 0.5;
          filter: hue-rotate(150deg) saturate(2.5);
          box-shadow: 0 0 30px rgba(34, 211, 238, 1), 0 0 60px rgba(56, 189, 248, 0.7);
        }
        60% {
          transform: translate(1px, -4px) scale(0.92);
          opacity: 0.4;
          filter: hue-rotate(180deg) saturate(2);
          box-shadow: 0 0 20px rgba(34, 211, 238, 0.8);
        }
        70% {
          transform: translate(-1px, 2px) scale(1.03);
          opacity: 0.3;
          filter: hue-rotate(210deg) saturate(1.5);
          box-shadow: 0 0 15px rgba(34, 211, 238, 0.6);
        }
        80% {
          transform: translate(2px, -1px) scale(0.97);
          opacity: 0.2;
          filter: hue-rotate(240deg) saturate(1.2);
          box-shadow: 0 0 10px rgba(34, 211, 238, 0.4);
        }
        90% {
          transform: translate(-2px, -2px) scale(1.01);
          opacity: 0.1;
          filter: hue-rotate(270deg) saturate(1);
          box-shadow: 0 0 5px rgba(34, 211, 238, 0.2);
        }
      }
    `;
  },

  getAnimationClass(dot, userData, isDeathSequence) {
    if (isDeathSequence) {
      return 'animate-[die_0.5s_ease-out_forwards]';
    }
    return 'animate-[glitch_2s_ease-in-out_forwards]';
  },

  getAnimationStyle(dot, userData) {
    return {};
  },

  getBorderClass() {
    return 'border-cyan-400';
  },

  getAtmosphereClass() {
    return '';
  },

  init() {},
  reset() {}
};

const AtomicDispersal = {
  metadata: {
    id: 'atomic',
    name: 'Atomic Dispersal',
    description: 'Physical matter drifts apart and transforms into new forms.',
    source: 'https://plato.stanford.edu/entries/materialism-eliminative/',
    category: 'philosophical',
    tradition: 'Materialism'
  },

  getStyles() {
    return `
      /* Atomic Dispersal - Drift */
      @keyframes atomic-drift {
        0% {
          transform: translate(0, 0) scale(1) rotate(0deg);
          opacity: 1;
          filter: brightness(1) saturate(1);
          box-shadow: 0 0 10px currentColor;
        }
        25% {
          transform: translate(calc(var(--drift-x) * 0.3), calc(var(--drift-y) * 0.3)) scale(0.9) rotate(90deg);
          opacity: 0.95;
          filter: brightness(1.2) saturate(1.3) hue-rotate(30deg);
          box-shadow: 0 0 15px currentColor, 0 0 30px rgba(34, 197, 94, 0.5);
        }
        50% {
          transform: translate(calc(var(--drift-x) * 0.6), calc(var(--drift-y) * 0.6)) scale(0.7) rotate(180deg);
          opacity: 0.9;
          filter: brightness(1.4) saturate(1.5) hue-rotate(60deg);
          box-shadow: 0 0 20px currentColor, 0 0 40px rgba(34, 197, 94, 0.7);
        }
        75% {
          transform: translate(calc(var(--drift-x) * 0.85), calc(var(--drift-y) * 0.85)) scale(0.5) rotate(270deg);
          opacity: 0.85;
          filter: brightness(1.6) saturate(1.7) hue-rotate(90deg);
          box-shadow: 0 0 25px currentColor, 0 0 50px rgba(34, 197, 94, 0.8);
        }
        to {
          transform: translate(var(--drift-x), var(--drift-y)) scale(0.3) rotate(360deg);
          opacity: 0.75;
          filter: brightness(1.8) saturate(2) hue-rotate(120deg);
          box-shadow: 0 0 30px currentColor, 0 0 60px rgba(34, 197, 94, 1);
        }
      }
    `;
  },

  getAnimationClass(dot, userData, isDeathSequence) {
    if (isDeathSequence) {
      return 'animate-[die_0.5s_ease-out_forwards]';
    }
    return 'animate-[atomic-drift_5s_ease-out_forwards]';
  },

  getAnimationStyle(dot, userData) {
    const driftX = (Math.random() - 0.5) * 500;
    const driftY = (Math.random() - 0.5) * 500;
    const newColors = ['#10b981', '#3b82f6', '#78350f'];
    return {
      '--drift-x': `${driftX}px`,
      '--drift-y': `${driftY}px`,
      backgroundColor: newColors[Math.floor(Math.random() * newColors.length)]
    };
  },

  getBorderClass() {
    return 'border-green-500';
  },

  getAtmosphereClass() {
    return '';
  },

  init() {},
  reset() {}
};

const HeatDeath = {
  metadata: {
    id: 'heatdeath',
    name: 'Heat Death',
    description: 'Gradual cooling and fading into maximum entropy.',
    source: 'https://plato.stanford.edu/entries/time-thermo/',
    category: 'philosophical',
    tradition: 'Thermodynamics / Materialism'
  },

  getStyles() {
    return `
      /* Heat Death - Gradual Cooling */
      @keyframes heat-death {
        0% {
          background-color: currentColor;
          opacity: 1;
          filter: blur(0px) brightness(1) saturate(1);
          box-shadow: 0 0 5px rgba(107, 114, 128, 0.3);
        }
        20% {
          background-color: rgb(107 114 128 / 0.9);
          opacity: 0.9;
          filter: blur(1px) brightness(0.95) saturate(0.9);
          box-shadow: 0 0 10px rgba(107, 114, 128, 0.3);
        }
        40% {
          background-color: rgb(75 85 99 / 0.8);
          opacity: 0.75;
          filter: blur(2px) brightness(0.85) saturate(0.7);
          box-shadow: 0 0 8px rgba(107, 114, 128, 0.25);
        }
        60% {
          background-color: rgb(55 65 81 / 0.6);
          opacity: 0.6;
          filter: blur(3px) brightness(0.7) saturate(0.5);
          box-shadow: 0 0 6px rgba(107, 114, 128, 0.2);
        }
        80% {
          background-color: rgb(55 65 81 / 0.4);
          opacity: 0.45;
          filter: blur(4px) brightness(0.5) saturate(0.3);
          box-shadow: 0 0 4px rgba(107, 114, 128, 0.15);
        }
        to {
          background-color: rgb(55 65 81 / 0.2);
          opacity: 0.2;
          filter: blur(6px) brightness(0.3) saturate(0.1);
          box-shadow: 0 0 2px rgba(107, 114, 128, 0.1);
        }
      }
    `;
  },

  getAnimationClass(dot, userData, isDeathSequence) {
    if (isDeathSequence) {
      return 'animate-[die_0.5s_ease-out_forwards]';
    }
    return 'animate-[heat-death_8s_ease-out_forwards]';
  },

  getAnimationStyle(dot, userData) {
    return {};
  },

  getBorderClass() {
    return 'border-gray-400';
  },

  getAtmosphereClass() {
    return '';
  },

  init() {},
  reset() {}
};

// Export all philosophical perspectives
export default {
  ancestor: AncestorTraditions,
  idealism: AnalyticIdealism,
  panpsychism: Panpsychism,
  illusionism: Illusionism,
  simulation: SimulationTheory,
  atomic: AtomicDispersal,
  heatdeath: HeatDeath,

  // Default to the first one
  ...AncestorTraditions,

  // Override metadata to list all variants
  metadata: {
    id: 'philosophical',
    name: 'Philosophical Perspectives',
    description: 'Various philosophical and scientific views on death',
    category: 'philosophical',
    variants: ['ancestor', 'idealism', 'panpsychism', 'illusionism', 'simulation', 'atomic', 'heatdeath']
  }
};
