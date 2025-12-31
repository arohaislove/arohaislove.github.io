# Chromesthesia Audio - Troubleshooting Guide

This guide covers common issues you might encounter and how to fix them.

## Table of Contents
1. [Audio Won't Play](#audio-wont-play)
2. [No Visualization Appearing](#no-visualization-appearing)
3. [Visualization is Laggy/Slow](#visualization-is-laggynslow)
4. [File Upload Not Working](#file-upload-not-working)
5. [Build Errors](#build-errors)
6. [Deployment Issues](#deployment-issues)

---

## Audio Won't Play

### Symptom
You upload a file but nothing happens when you click play, or you get an error message.

### Common Causes & Fixes

**1. Browser AutoPlay Policy**
- **Why:** Browsers block audio from playing automatically until user interaction
- **Fix:** Make sure you're clicking the play button AFTER uploading the file
- **Fix:** Try reloading the page and uploading again

**2. Unsupported File Format**
- **Why:** Browser doesn't support the audio codec
- **Fix:** Try converting your file to MP3 or WAV (most universally supported)
- **Supported formats:** MP3, WAV, OGG, AAC
- **Not supported:** FLAC, ALAC, some M4A files

**3. Corrupted Audio File**
- **Why:** The file is damaged or incomplete
- **Fix:** Try playing the file in another app first
- **Fix:** Re-download or re-export the audio file

**4. AudioContext Suspended**
- **Why:** Browser suspended the audio context to save resources
- **Fix:** The code should resume it automatically, but if not, try:
  - Click pause then play again
  - Reload the page
  - Check browser console for errors

**How to debug:**
1. Open browser console (F12 or Cmd+Option+J on Mac)
2. Look for errors mentioning "AudioContext" or "play"
3. Check if the file is actually loading (Network tab)

---

## No Visualization Appearing

### Symptom
Audio plays but the canvas is blank or shows only the background.

### Common Causes & Fixes

**1. Canvas Not Rendering**
- **Check:** Is the canvas element visible in the DOM?
- **Fix:** Open browser inspector, find the `<canvas>` element
- **Fix:** Make sure it has width and height attributes

**2. Frequency Data Not Updating**
- **Why:** The analyzer isn't connected properly
- **Debug:** Add this to `useAudioAnalyzer.js` in the `analyzeFrequencies` function:
  ```javascript
  console.log('Frequencies:', { bass, mids, treble });
  ```
- **Expected:** Should see changing numbers when audio plays
- **If all zeros:** Audio pipeline isn't connected correctly

**3. requestAnimationFrame Not Running**
- **Why:** The animation loop stopped or never started
- **Debug:** Add to `App.jsx` in the `draw` function:
  ```javascript
  console.log('Drawing frame');
  ```
- **Expected:** Should see this log 60 times per second when playing
- **If not:** Check for JavaScript errors in console

**4. Canvas Size is Zero**
- **Why:** Canvas hasn't been sized yet
- **Fix:** Check the `canvasSize` state in App.jsx
- **Debug:** Add:
  ```javascript
  console.log('Canvas size:', canvasSize);
  ```
- **Expected:** Should see `{width: X, height: Y}` with real numbers

---

## Visualization is Laggy/Slow

### Symptom
Animation is choppy, stuttering, or running below 60 FPS.

### Common Causes & Fixes

**1. Too Many Particles (High Treble)**
- **Why:** Creating 50+ particles every frame is expensive
- **Fix:** Reduce particle count in `App.jsx`:
  ```javascript
  // Change this line:
  const particleCount = Math.floor(frequencies.treble / 2);
  // To this:
  const particleCount = Math.floor(frequencies.treble / 4); // Half as many
  ```

**2. High FFT Size**
- **Why:** Larger FFT = more CPU work
- **Fix:** In `useAudioAnalyzer.js`, change:
  ```javascript
  analyser.fftSize = 2048; // Change to 1024 for better performance
  ```
- **Trade-off:** Less frequency accuracy but faster

**3. Shadow Blur is Expensive**
- **Why:** Canvas shadow rendering is slow on some devices
- **Fix:** Reduce shadow blur in `App.jsx`:
  ```javascript
  ctx.shadowBlur = 40; // Change to 20 or 10
  ```

**4. High DPI Display**
- **Why:** Retina/4K screens have 4x the pixels to draw
- **Fix:** Scale canvas down on high-DPI screens:
  ```javascript
  // In the canvas size useEffect:
  setCanvasSize({
    width: window.innerWidth / 2,  // Add / 2
    height: window.innerHeight / 2 // Add / 2
  });
  ```

**5. Mobile Device**
- **Why:** Mobile GPUs are less powerful
- **Fix:** Detect mobile and reduce effects:
  ```javascript
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const particleCount = isMobile
    ? Math.floor(frequencies.treble / 8)  // Fewer particles
    : Math.floor(frequencies.treble / 2);
  ```

---

## File Upload Not Working

### Symptom
Clicking "Upload Audio File" does nothing, or file doesn't load.

### Common Causes & Fixes

**1. File Input Not Triggering**
- **Check:** Is the `<input type="file">` present in the DOM?
- **Fix:** Make sure the `htmlFor` attribute matches the input `id`:
  ```javascript
  <label htmlFor="audio-upload">  {/* Must match input id */}
  <input id="audio-upload" />
  ```

**2. File Too Large**
- **Why:** Browser might struggle with huge files
- **Fix:** Try a smaller file first (< 10MB)
- **Fix:** Compress your audio file

**3. CORS Issues**
- **Why:** Loading audio from another domain
- **Fix:** Only upload local files (this app doesn't support URLs)
- **Note:** The `crossOrigin = 'anonymous'` is already set

**4. Wrong File Type**
- **Check:** Is `accept="audio/*"` on the input?
- **Fix:** Make sure you're selecting an audio file, not a video or other type

---

## Build Errors

### Symptom
Running `npm run build` fails with errors.

### Common Causes & Fixes

**1. Dependencies Not Installed**
- **Error:** "Cannot find module 'react'" or similar
- **Fix:**
  ```bash
  npm install
  ```

**2. Node Version Too Old**
- **Error:** Syntax errors or "unexpected token"
- **Fix:** Update Node.js to version 16 or later
- **Check version:**
  ```bash
  node --version  # Should be v16.x or higher
  ```

**3. Vite Build Fails**
- **Error:** "Failed to build"
- **Fix:** Check for syntax errors in your code
- **Fix:** Make sure all imports are correct:
  ```javascript
  import App from './App.jsx'  // Include .jsx extension
  ```

**4. Out of Memory**
- **Error:** "JavaScript heap out of memory"
- **Fix:** Increase Node memory:
  ```bash
  NODE_OPTIONS=--max-old-space-size=4096 npm run build
  ```

---

## Deployment Issues

### Symptom
App works locally but not on GitHub Pages.

### Common Causes & Fixes

**1. Wrong Base Path**
- **Why:** Vite needs to know the subdirectory for GitHub Pages
- **Fix:** Check `vite.config.js`:
  ```javascript
  base: '/chromesthesia-audio/',  // Must match your repo structure
  ```

**2. Assets Not Loading**
- **Symptom:** Page loads but JavaScript/CSS missing (404 errors)
- **Fix:** Check the browser console for 404 errors
- **Fix:** Verify the `base` path matches your GitHub Pages URL

**3. CORS Errors on GitHub Pages**
- **Why:** GitHub Pages serves with different headers than localhost
- **Fix:** Make sure you're uploading local files, not using remote URLs
- **Fix:** The app should work since it processes local files only

**4. Build Files Not Committed**
- **Why:** You need to commit the built files for GitHub Pages
- **Fix:** After running `npm run build`:
  ```bash
  git add assets/  # Add the built assets
  git add index.html  # Add the built HTML
  git commit -m "Build for production"
  git push
  ```

---

## General Debugging Tips

### Enable Verbose Logging

Add console logs to see what's happening:

**In useAudioAnalyzer.js:**
```javascript
// In analyzeFrequencies function:
console.log('Analyzing:', {
  bass: Math.round((bassAvg / 255) * 100),
  mids: Math.round((midsAvg / 255) * 100),
  treble: Math.round((trebleAvg / 255) * 100)
});
```

**In App.jsx:**
```javascript
// In the draw function:
console.log('Drawing with frequencies:', frequencies);
```

### Check Browser Compatibility

**Supported browsers:**
- Chrome 60+ ✅
- Firefox 55+ ✅
- Safari 14+ ✅
- Edge 79+ ✅

**Not supported:**
- Internet Explorer ❌
- Very old mobile browsers ❌

### Test Audio Files

Try these test files to isolate issues:
1. A simple sine wave tone (pure frequency test)
2. A short MP3 (< 1MB) to rule out file size
3. A different file format (MP3 vs WAV)

### Browser Console Commands

Open console and try:
```javascript
// Check if Web Audio API is available
console.log('AudioContext:', window.AudioContext || window.webkitAudioContext);

// Check canvas
const canvas = document.querySelector('canvas');
console.log('Canvas:', canvas);
console.log('Canvas size:', canvas.width, canvas.height);

// Check if React rendered
console.log('Root element:', document.getElementById('root'));
```

---

## Still Stuck?

If none of these fixes work:

1. **Check the browser console** for specific error messages
2. **Try a different browser** (Chrome is most reliable for Web Audio)
3. **Test on a different device** to rule out hardware issues
4. **Simplify the visualization** temporarily to isolate the problem:
   - Comment out treble particles
   - Comment out mids triangles
   - See if just the bass circle works

5. **Check file permissions** (if running locally):
   ```bash
   ls -la chromesthesia-audio/
   # All files should be readable
   ```

Good luck! 🎵🎨
