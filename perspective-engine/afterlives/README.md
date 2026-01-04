# Afterlife Modules

This directory contains modular, isolated implementations of different religious and philosophical afterlife perspectives. Each module can be developed, tested, and refined independently before being integrated into the main Perspective Engine.

## Why Modular?

The original Perspective Engine had **all 14 afterlife perspectives** crammed into a single 97KB HTML file. This modular approach:

- **Reduces cognitive load** - Work on one perspective at a time
- **Faster iteration** - Small files load instantly, easier to navigate
- **Easier debugging** - When something breaks, you know exactly where
- **Prevents interference** - Each perspective's logic is isolated
- **Enables creative divergence** - Each afterlife can have unique mechanics without compromise

## Directory Structure

```
afterlives/
├── afterlife-interface.js    # Shared contract for all modules
├── test-harness.html          # Isolated testing environment
├── README.md                  # This file
├── buddhism.js                # Buddhist perspectives (Rebirth, Nirvana)
├── christianity.js            # Christian perspectives (Heaven, Purgatory, Hell)
├── islam.js                   # Islamic perspectives (Jannah, Jahannam)
├── hinduism.js                # Hindu perspectives (Reincarnation, Moksha)
├── judaism.js                 # Jewish perspective (Rest in Sheol)
└── philosophical.js           # 7 philosophical perspectives
```

## Available Modules

### Religious Perspectives

| Module | Variants | Description |
|--------|----------|-------------|
| **Buddhism** | Rebirth, Nirvana | Dissolution/reformation OR liberation from rebirth cycle |
| **Christianity** | Heaven, Purgatory, Hell | Eternal paradise, purification, OR separation from God |
| **Islam** | Jannah, Jahannam | Paradise OR punishment (both with Barzakh pause) |
| **Hinduism** | Reincarnation, Moksha | Rebirth in new form OR union with Brahman |
| **Judaism** | Rest | Peaceful rest in Sheol awaiting the World to Come |

### Philosophical Perspectives

All in `philosophical.js`:

| Perspective | Description |
|-------------|-------------|
| **Ancestor Traditions** | Joining those who came before |
| **Analytic Idealism** | Dissolving into universal mind |
| **Panpsychism** | Fragmenting into universal consciousness |
| **Illusionism** | Consciousness simply switches off |
| **Simulation Theory** | Reality glitches as simulation ends |
| **Atomic Dispersal** | Matter drifts apart and transforms |
| **Heat Death** | Gradual cooling into maximum entropy |

## The Shared Interface

All modules implement the same contract defined in `afterlife-interface.js`:

```javascript
{
  metadata: {
    id: 'unique-id',
    name: 'Display Name',
    description: 'Brief description',
    source: 'https://academic-source',
    category: 'religious' | 'philosophical',
    tradition: 'Buddhism' | 'Christianity' | etc.
  },

  getStyles() {
    // Returns CSS string with @keyframes animations
  },

  getAnimationClass(dot, userData, isDeathSequence) {
    // Returns Tailwind animation class
  },

  getAnimationStyle(dot, userData) {
    // Returns inline styles for dynamic values
  },

  getBorderClass() {
    // Returns border color class
  },

  getAtmosphereClass() {
    // Returns atmospheric background class (optional)
  },

  init() {
    // Optional: Setup code
  },

  reset() {
    // Optional: Cleanup code
  }
}
```

## Using the Test Harness

The test harness (`test-harness.html`) lets you test each module in isolation:

### 1. Open the Test Harness

Open `test-harness.html` directly in your browser (no server needed for now).

### 2. Select a Module

Use the dropdown to load a specific module (Buddhism, Christianity, Islam, Hinduism).

### 3. Configure User Data

- Set your current age
- Set life expectancy
- This generates the correct number of dots for the timeline

### 4. Trigger Animations

- **Trigger Death Sequence**: Watch dots fade to gray (standard death animation)
- **Show Afterlife**: Apply the selected perspective's animation
- **Reset**: Clear all animations and start over

### 5. Debug

Check the debug panel at the bottom to see:
- Current user data
- Animation state
- Loaded module info

## Working on a Specific Afterlife

Let's say you want to refine the **Buddhist Rebirth** animation. Here's your workflow:

### 1. Open the Module

```bash
code perspective-engine/afterlives/buddhism.js
```

### 2. Find the Animation

Look for the `getStyles()` method in the `BuddhismRebirth` object:

```javascript
getStyles() {
  return `
    @keyframes buddhist-dissolve {
      /* Edit the animation here */
    }
  `;
}
```

### 3. Edit the Animation

Change keyframes, colors, transforms, timing - whatever you want:

```javascript
@keyframes buddhist-dissolve {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1) rotate(0deg);
    filter: brightness(1) hue-rotate(0deg);
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.6);
  }
  50% {
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
```

### 4. Test It

1. Open `test-harness.html` in browser
2. Select "Buddhism (Rebirth & Nirvana)" from dropdown
3. Click "Show Afterlife"
4. Watch your animation play

### 5. Iterate

Keep editing the CSS and refreshing the browser until it looks perfect.

### 6. No Need to Touch the Main File

You're working in a small, focused module. The 97KB main file? Untouched. No scrolling through 1700 lines of code.

## Creating New Perspectives

Want to add a new afterlife view? Here's how:

### 1. Create a New Module File

```bash
touch perspective-engine/afterlives/my-new-perspective.js
```

### 2. Copy the Interface Template

Use `afterlife-interface.js` as your starting point:

```javascript
export default {
  metadata: {
    id: 'my-perspective',
    name: 'My Perspective',
    description: 'What happens when...',
    source: 'https://source-url',
    category: 'philosophical',
    tradition: 'Your Tradition'
  },

  getStyles() {
    return `
      @keyframes my-animation {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
  },

  getAnimationClass(dot, userData, isDeathSequence) {
    if (isDeathSequence) {
      return 'animate-[die_0.5s_ease-out_forwards]';
    }
    return 'animate-[my-animation_3s_ease-out_forwards]';
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
```

### 3. Test It

Add your module to the test harness dropdown and test independently.

### 4. Integrate Later

Once it's polished, you can integrate it into the main Perspective Engine.

## Module Best Practices

### 1. Keep Animations Self-Contained

Each module should define its own `@keyframes`. Don't rely on animations from other modules.

### 2. Use CSS Variables for Random Values

If your animation needs random positions (like Hinduism's Reincarnation):

```javascript
getAnimationStyle(dot, userData) {
  const scatterX = (Math.random() - 0.5) * 400;
  return {
    '--scatter-x': `${scatterX}px`
  };
}
```

Then reference in CSS:

```css
@keyframes reincarnate-scatter {
  50% {
    transform: translate(var(--scatter-x), 0);
  }
}
```

### 3. Respect the Death Sequence

Always check `isDeathSequence` and return the standard death animation:

```javascript
if (isDeathSequence) {
  return 'animate-[die_0.5s_ease-out_forwards]';
}
```

This ensures consistency across all perspectives.

### 4. Document Your Animations

Add comments explaining what each keyframe stage represents:

```css
@keyframes rise-to-heaven {
  0% {
    /* Soul at moment of death */
  }
  50% {
    /* Ascending toward paradise */
  }
  100% {
    /* Arrival in heaven */
  }
}
```

## Integration Strategy (Future)

Once all modules are refined, you can:

### Option 1: Dynamic Import

Update the main `perspective-engine/index.html` to dynamically import modules:

```javascript
const buddhism = await import('./afterlives/buddhism.js');
const styles = buddhism.default.rebirth.getStyles();
```

### Option 2: Build Script

Create a build script that concatenates all module CSS into one file.

### Option 3: Keep Modular

Use ES modules directly in production for better caching and maintainability.

## Troubleshooting

### Module Won't Load in Test Harness

Check browser console for errors. Common issues:
- Syntax errors in JavaScript
- Missing `export default`
- Invalid CSS in `getStyles()`

### Animation Doesn't Play

- Make sure animation class is properly returned
- Check that `@keyframes` name matches the animation class
- Verify Tailwind animation syntax is correct

### Random Values Don't Work

- Ensure you're setting CSS variables in `getAnimationStyle()`
- Use `var(--variable-name)` in CSS, not JavaScript template literals

## Summary

**Before:** One monolithic 97KB file with 14 tangled perspectives

**After:** Clean, modular architecture where each perspective is:
- Isolated in its own file
- Testable independently
- Easy to understand and modify
- Following a consistent interface

**Next Steps:**
1. Open `test-harness.html` in your browser
2. Test each module to make sure they work
3. Pick the perspective you want to refine
4. Edit, test, iterate until it's perfect
5. Move on to the next one

No more tangled code. No more scrolling through thousands of lines. Just clean, focused development.

**Questions?** Check `afterlife-interface.js` for the full contract specification.
