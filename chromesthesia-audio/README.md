# Chromesthesia Audio

A web app that visualizes audio as colors and shapes in real-time. Upload an MP3 or WAV file and watch as bass, mids, and treble frequencies create a synesthetic light show.

## Features

- **Simple Audio Analysis**: Breaks down audio into 3 frequency bands (bass, mids, treble)
- **Real-time Visualization**: Canvas 2D rendering at 60 FPS
- **Synesthetic Color Mapping**:
  - 🔴 Bass → Warm colors (red, orange) + pulsing center
  - 🟢 Mids → Mid-spectrum colors (green, yellow) + rotating triangles
  - 🔵 Treble → Cool colors (blue, purple) + sparkle particles
- **Mobile-Friendly**: Touch-optimized controls and responsive design
- **No Backend Required**: Runs entirely in the browser using Web Audio API

## Project Structure

```
chromesthesia-audio/
├── src/
│   ├── App.jsx                    # Main component with visualization
│   ├── main.jsx                   # React entry point
│   ├── styles.css                 # All styling
│   ├── hooks/
│   │   └── useAudioAnalyzer.js    # Custom hook for Web Audio API
│   └── utils/
│       └── colorMapping.js        # Frequency-to-color functions
├── index.html                     # HTML entry point
├── package.json                   # Dependencies
├── vite.config.js                 # Build configuration
├── README.md                      # This file
└── TROUBLESHOOTING.md            # Debug guide

```

## Getting Started

### Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start dev server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   - Usually `http://localhost:5173`

### Building for Production

```bash
npm run build
```

This builds the app and outputs to the `assets/` folder.

### Deploying to GitHub Pages

The app is configured to work on GitHub Pages. After building:

1. Commit the built files:
   ```bash
   git add assets/ index.html
   git commit -m "Build for production"
   git push
   ```

2. GitHub Pages will serve from the `chromesthesia-audio/` folder

## How It Works

### Audio Analysis (useAudioAnalyzer hook)

1. **AudioContext** processes the audio file
2. **AnalyserNode** extracts frequency data (FFT)
3. Raw frequency data is simplified into 3 bands:
   - Bass: 0-250 Hz (low frequencies)
   - Mids: 250-4000 Hz (middle frequencies)
   - Treble: 4000-20000 Hz (high frequencies)
4. Values normalized to 0-100 for easy use

### Visualization (App.jsx)

1. **requestAnimationFrame** runs the draw loop at ~60 FPS
2. Canvas is cleared each frame
3. Three types of shapes are drawn:
   - **Bass**: Central circle that pulses with bass
   - **Mids**: Triangles that rotate around the center
   - **Treble**: Particles that sparkle and twinkle
4. Colors are mapped using functions from `colorMapping.js`

## Code Philosophy

- **Beginner-friendly**: Heavy commenting explains the "why" not just the "what"
- **Separation of concerns**: Audio logic is separate from visualization
- **Clean abstractions**: Custom hook hides Web Audio complexity
- **Debuggable**: Clear state, predictable flow, easy to add console.logs

## Customization Ideas

Want to modify the visualization? Here are some ideas:

### Change the colors
Edit `src/utils/colorMapping.js` to use different color ranges.

### Add more frequency bands
In `useAudioAnalyzer.js`, split the frequency array into more sections (e.g., sub-bass, bass, low-mids, mids, highs, treble).

### Change the shapes
In `App.jsx`, replace the circles/triangles with:
- Squares
- Hexagons
- Lines/waveforms
- Custom SVG paths

### Add microphone input
```javascript
// In useAudioAnalyzer.js, add a new function:
const useMicrophone = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = audioContextRef.current.createMediaStreamSource(stream);
  source.connect(analyserRef.current);
  // Start analyzing...
};
```

### Add more visual modes
Create different visualization styles and let users switch between them.

## Browser Support

- Chrome 60+ ✅
- Firefox 55+ ✅
- Safari 14+ ✅
- Edge 79+ ✅
- Internet Explorer ❌

## Troubleshooting

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.

## License

MIT - Feel free to use this code for your own projects!

## Credits

Built with:
- React 18
- Vite 5
- Web Audio API
- Canvas 2D API
