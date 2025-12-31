import { useRef, useEffect, useState } from 'react';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';
import {
  getBassColor,
  getMidsColor,
  getTrebleColor,
  getGlowColor
} from './utils/colorMapping';
import './styles.css';

/**
 * Main Chromesthesia Audio App
 *
 * WHAT THIS DOES:
 * 1. Lets user upload an audio file
 * 2. Analyzes the audio into 3 frequency bands (bass, mids, treble)
 * 3. Visualizes those frequencies as animated shapes on a canvas
 *
 * HOW IT'S ORGANIZED:
 * - useAudioAnalyzer hook: Handles all Web Audio API complexity
 * - Canvas rendering: Draws shapes based on frequency data
 * - UI controls: File upload, play/pause buttons
 */
function App() {
  // ===== AUDIO ANALYSIS =====
  // This custom hook gives us clean frequency data (0-100 for each band)
  const {
    frequencies,      // { bass: 0-100, mids: 0-100, treble: 0-100 }
    isPlaying,
    hasAudio,
    error,
    loadAudio,
    togglePlayPause
  } = useAudioAnalyzer();

  // ===== CANVAS SETUP =====
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Track rotation for animation
  const rotationRef = useRef(0);

  /**
   * Handle file upload
   *
   * WHY SEPARATE FUNCTION:
   * - Validates the file is audio
   * - Provides clear error messages
   * - Keeps the JSX clean
   */
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if it's an audio file
    if (!file.type.startsWith('audio/')) {
      alert('Please upload an audio file (MP3, WAV, etc.)');
      return;
    }

    loadAudio(file);
  };

  /**
   * Set canvas size to match window size
   *
   * WHY THIS MATTERS:
   * - Canvas should fill the screen for immersive experience
   * - Needs to update when window is resized
   * - Uses devicePixelRatio for sharp rendering on high-DPI screens
   */
  useEffect(() => {
    const updateCanvasSize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  /**
   * Main visualization loop
   *
   * THIS IS WHERE THE MAGIC HAPPENS:
   * - Runs ~60 times per second via requestAnimationFrame
   * - Clears canvas
   * - Draws shapes based on current frequency values
   * - Creates smooth animations
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;

    const draw = () => {
      // Clear the canvas (start fresh each frame)
      ctx.fillStyle = '#0a0a0a'; // Very dark background
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Get center of canvas
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // ===== BASS VISUALIZATION =====
      // Central pulsing circle
      // SIZE: Bigger when bass is loud
      // COLOR: Warm colors (reds, oranges)

      const bassRadius = 50 + (frequencies.bass * 2); // 50-250 pixels
      const bassColor = getBassColor(frequencies.bass);

      // Draw outer glow
      ctx.shadowBlur = 40;
      ctx.shadowColor = bassColor;

      ctx.fillStyle = bassColor;
      ctx.globalAlpha = 0.7; // Slightly transparent
      ctx.beginPath();
      ctx.arc(centerX, centerY, bassRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw inner bright core
      ctx.globalAlpha = 1;
      ctx.fillStyle = getGlowColor(bassColor, 0.6);
      ctx.beginPath();
      ctx.arc(centerX, centerY, bassRadius * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Reset shadow
      ctx.shadowBlur = 0;

      // ===== MIDS VISUALIZATION =====
      // Rotating triangles around the center
      // ROTATION SPEED: Faster when mids are loud
      // COLOR: Middle spectrum (greens, yellows)

      const midsColor = getMidsColor(frequencies.mids);
      const rotationSpeed = 0.001 + (frequencies.mids * 0.0001);
      rotationRef.current += rotationSpeed;

      // Number of triangles (more when mids are louder)
      const triangleCount = Math.max(3, Math.floor(frequencies.mids / 15));
      const triangleDistance = bassRadius + 80; // Distance from center

      ctx.fillStyle = midsColor;
      ctx.shadowBlur = 20;
      ctx.shadowColor = midsColor;

      for (let i = 0; i < triangleCount; i++) {
        const angle = (Math.PI * 2 / triangleCount) * i + rotationRef.current;
        const x = centerX + Math.cos(angle) * triangleDistance;
        const y = centerY + Math.sin(angle) * triangleDistance;

        // Triangle size based on mids intensity
        const size = 20 + (frequencies.mids * 0.3);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle + Math.PI / 2); // Point towards center

        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(-size * 0.866, size * 0.5);
        ctx.lineTo(size * 0.866, size * 0.5);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      ctx.shadowBlur = 0;

      // ===== TREBLE VISUALIZATION =====
      // Sparkle particles scattered around
      // COUNT: More particles when treble is loud
      // COLOR: Cool colors (blues, purples)

      const trebleColor = getTrebleColor(frequencies.treble);
      const particleCount = Math.floor(frequencies.treble / 2); // 0-50 particles

      ctx.fillStyle = trebleColor;
      ctx.shadowBlur = 15;
      ctx.shadowColor = trebleColor;

      for (let i = 0; i < particleCount; i++) {
        // Create random but consistent positions using sine/cosine
        // (using index to keep them stable, not truly random each frame)
        const angle = (i * 137.5) * (Math.PI / 180); // Golden angle for even distribution
        const distance = 150 + (i % 200);

        const x = centerX + Math.cos(angle + rotationRef.current * 2) * distance;
        const y = centerY + Math.sin(angle + rotationRef.current * 2) * distance;

        // Particle size varies
        const size = 2 + Math.random() * 4;

        ctx.globalAlpha = 0.5 + Math.random() * 0.5; // Twinkle effect
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Reset alpha and shadow
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // Continue animation loop
      animationId = requestAnimationFrame(draw);
    };

    // Start the visualization loop
    draw();

    // Cleanup: stop animation when component unmounts
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [frequencies]); // Re-run when frequencies change

  // ===== RENDER UI =====
  return (
    <div className="app">
      {/* Canvas for visualization */}
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="visualization-canvas"
      />

      {/* Controls overlay */}
      <div className="controls">
        <div className="controls-inner">
          <h1>Chromesthesia Audio</h1>
          <p className="tagline">Visualize sound as color and motion</p>

          {/* File upload */}
          <div className="upload-section">
            <label htmlFor="audio-upload" className="upload-button">
              {hasAudio ? '🎵 Load Different Audio' : '🎵 Upload Audio File'}
            </label>
            <input
              id="audio-upload"
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="file-input"
            />
          </div>

          {/* Play/Pause button (only show when audio is loaded) */}
          {hasAudio && (
            <button onClick={togglePlayPause} className="play-button">
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
          )}

          {/* Error display */}
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          {/* Frequency indicators (only show when playing) */}
          {isPlaying && (
            <div className="frequency-indicators">
              <div className="indicator">
                <span className="label">Bass</span>
                <div className="bar">
                  <div
                    className="fill bass"
                    style={{ width: `${frequencies.bass}%` }}
                  />
                </div>
                <span className="value">{frequencies.bass}</span>
              </div>

              <div className="indicator">
                <span className="label">Mids</span>
                <div className="bar">
                  <div
                    className="fill mids"
                    style={{ width: `${frequencies.mids}%` }}
                  />
                </div>
                <span className="value">{frequencies.mids}</span>
              </div>

              <div className="indicator">
                <span className="label">Treble</span>
                <div className="bar">
                  <div
                    className="fill treble"
                    style={{ width: `${frequencies.treble}%` }}
                  />
                </div>
                <span className="value">{frequencies.treble}</span>
              </div>
            </div>
          )}

          {/* Instructions */}
          {!hasAudio && (
            <div className="instructions">
              <p>Upload an MP3 or WAV file to see it visualized</p>
              <p>🔴 Bass → Red/Orange pulses</p>
              <p>🟢 Mids → Green rotating triangles</p>
              <p>🔵 Treble → Blue sparkles</p>
            </div>
          )}
        </div>

        {/* Back to projects link */}
        <a href="/" className="back-link">← Back to Projects</a>
      </div>
    </div>
  );
}

export default App;
