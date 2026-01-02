/**
 * Color Mapping Utilities
 *
 * These functions map frequency band intensities (0-100) to colors.
 * WHY THESE SPECIFIC COLOR RANGES?
 * - Bass (warm colors): Deep bass "feels" warm and grounding
 * - Mids (middle colors): Mids are where vocals and melody live
 * - Treble (cool colors): High frequencies "sparkle" like cool light
 */

/**
 * Map bass frequency (0-100) to a warm color (reds, oranges, yellows)
 *
 * HOW THIS WORKS:
 * - Low bass (0-30): Deep red
 * - Mid bass (30-70): Orange/red-orange
 * - High bass (70-100): Yellow-orange
 *
 * @param {number} intensity - Bass level (0-100)
 * @returns {string} RGB color string like "rgb(255, 100, 50)"
 */
export function getBassColor(intensity) {
  // Clamp intensity to 0-100 range (just in case)
  intensity = Math.max(0, Math.min(100, intensity));

  // Map 0-100 to color transitions
  if (intensity < 30) {
    // Low bass: Deep red to red
    const factor = intensity / 30;
    const r = 139 + Math.round((255 - 139) * factor); // 139 → 255
    const g = 0 + Math.round(50 * factor);             // 0 → 50
    const b = 0;
    return `rgb(${r}, ${g}, ${b})`;
  } else if (intensity < 70) {
    // Mid bass: Red-orange to orange
    const factor = (intensity - 30) / 40;
    const r = 255;
    const g = 50 + Math.round((140 - 50) * factor);   // 50 → 140
    const b = 0;
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // High bass: Orange to yellow-orange
    const factor = (intensity - 70) / 30;
    const r = 255;
    const g = 140 + Math.round((200 - 140) * factor); // 140 → 200
    const b = 0;
    return `rgb(${r}, ${g}, ${b})`;
  }
}

/**
 * Map mids frequency (0-100) to middle spectrum colors (greens, yellows)
 *
 * HOW THIS WORKS:
 * - Low mids (0-30): Yellow-green
 * - Mid mids (30-70): Green
 * - High mids (70-100): Bright lime green
 *
 * @param {number} intensity - Mids level (0-100)
 * @returns {string} RGB color string
 */
export function getMidsColor(intensity) {
  intensity = Math.max(0, Math.min(100, intensity));

  if (intensity < 30) {
    // Low mids: Yellow-green to green
    const factor = intensity / 30;
    const r = 150 - Math.round(100 * factor);         // 150 → 50
    const g = 200 + Math.round(55 * factor);          // 200 → 255
    const b = 0;
    return `rgb(${r}, ${g}, ${b})`;
  } else if (intensity < 70) {
    // Mid mids: Green shades
    const factor = (intensity - 30) / 40;
    const r = 50 - Math.round(25 * factor);           // 50 → 25
    const g = 255;
    const b = 0 + Math.round(100 * factor);           // 0 → 100
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // High mids: Bright lime green
    const factor = (intensity - 70) / 30;
    const r = 25 + Math.round(75 * factor);           // 25 → 100
    const g = 255;
    const b = 100 + Math.round(55 * factor);          // 100 → 155
    return `rgb(${r}, ${g}, ${b})`;
  }
}

/**
 * Map treble frequency (0-100) to cool colors (blues, purples)
 *
 * HOW THIS WORKS:
 * - Low treble (0-30): Cyan/turquoise
 * - Mid treble (30-70): Blue
 * - High treble (70-100): Purple/violet
 *
 * @param {number} intensity - Treble level (0-100)
 * @returns {string} RGB color string
 */
export function getTrebleColor(intensity) {
  intensity = Math.max(0, Math.min(100, intensity));

  if (intensity < 30) {
    // Low treble: Cyan to blue
    const factor = intensity / 30;
    const r = 0;
    const g = 200 - Math.round(100 * factor);         // 200 → 100
    const b = 255;
    return `rgb(${r}, ${g}, ${b})`;
  } else if (intensity < 70) {
    // Mid treble: Blue shades
    const factor = (intensity - 30) / 40;
    const r = 0 + Math.round(75 * factor);            // 0 → 75
    const g = 100 - Math.round(50 * factor);          // 100 → 50
    const b = 255;
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // High treble: Blue to purple/violet
    const factor = (intensity - 70) / 30;
    const r = 75 + Math.round(105 * factor);          // 75 → 180
    const g = 50 - Math.round(30 * factor);           // 50 → 20
    const b = 255;
    return `rgb(${r}, ${g}, ${b})`;
  }
}

/**
 * Create a combined color from all three frequency bands
 *
 * WHY THIS EXISTS:
 * Sometimes you want one color that represents the whole audio,
 * not separate colors for each band. This blends them together.
 *
 * HOW IT WORKS:
 * - Gets the color for each band based on its intensity
 * - Blends them using weighted averaging
 * - Weights are based on intensity (louder bands influence more)
 *
 * @param {Object} frequencies - { bass: 0-100, mids: 0-100, treble: 0-100 }
 * @returns {string} Blended RGB color string
 */
export function getCombinedColor(frequencies) {
  const { bass, mids, treble } = frequencies;

  // Get individual colors
  const bassColor = parseRgb(getBassColor(bass));
  const midsColor = parseRgb(getMidsColor(mids));
  const trebleColor = parseRgb(getTrebleColor(treble));

  // Calculate weights (higher intensity = more influence)
  // Add 1 to avoid division by zero
  const totalIntensity = bass + mids + treble + 1;
  const bassWeight = bass / totalIntensity;
  const midsWeight = mids / totalIntensity;
  const trebleWeight = treble / totalIntensity;

  // Blend the colors using weighted average
  const r = Math.round(
    bassColor.r * bassWeight +
    midsColor.r * midsWeight +
    trebleColor.r * trebleWeight
  );
  const g = Math.round(
    bassColor.g * bassWeight +
    midsColor.g * midsWeight +
    trebleColor.g * trebleWeight
  );
  const b = Math.round(
    bassColor.b * bassWeight +
    midsColor.b * midsWeight +
    trebleColor.b * trebleWeight
  );

  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Parse an RGB string into component values
 *
 * @param {string} rgbString - "rgb(255, 100, 50)"
 * @returns {Object} { r: 255, g: 100, b: 50 }
 */
function parseRgb(rgbString) {
  // Extract numbers from "rgb(r, g, b)" format
  const matches = rgbString.match(/\d+/g);
  return {
    r: parseInt(matches[0]),
    g: parseInt(matches[1]),
    b: parseInt(matches[2])
  };
}

/**
 * Get a glow effect color (lighter/brighter version of the main color)
 *
 * WHY THIS EXISTS:
 * Canvas shapes look better with a glow effect.
 * This creates a lighter version of any color for the glow.
 *
 * @param {string} rgbString - Base color "rgb(r, g, b)"
 * @param {number} glowFactor - How much brighter (0.5 = 50% brighter)
 * @returns {string} Brighter RGB color
 */
export function getGlowColor(rgbString, glowFactor = 0.5) {
  const { r, g, b } = parseRgb(rgbString);

  // Brighten by moving towards white (255)
  const newR = Math.min(255, Math.round(r + (255 - r) * glowFactor));
  const newG = Math.min(255, Math.round(g + (255 - g) * glowFactor));
  const newB = Math.min(255, Math.round(b + (255 - b) * glowFactor));

  return `rgb(${newR}, ${newG}, ${newB})`;
}
