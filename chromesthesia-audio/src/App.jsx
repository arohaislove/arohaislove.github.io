import { useRef, useEffect, useState } from 'react';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';
import { createFlock } from './utils/boids';
import './styles.css';

/**
 * Chromesthesia Audio - Advanced Edition
 *
 * Full-screen immersive audio visualization with:
 * - 8-band frequency analysis for nuanced control
 * - Flocking boids that dance to the music
 * - Minimal collapsible UI
 * - Complex multi-layered visuals
 */
function App() {
  // ===== AUDIO ANALYSIS =====
  const {
    frequencies,      // Now with 8 bands!
    isPlaying,
    hasAudio,
    isMicActive,
    error,
    loadAudio,
    togglePlayPause,
    toggleMicrophone
  } = useAudioAnalyzer();

  // ===== UI STATE =====
  const [controlsVisible, setControlsVisible] = useState(true);

  // ===== CANVAS SETUP =====
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // ===== ANIMATION STATE =====
  const rotationRef = useRef(0);
  const boidsRef = useRef(null);
  const trailsRef = useRef([]); // For particle trails

  /**
   * Handle file upload
   */
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      alert('Please upload an audio file (MP3, WAV, etc.)');
      return;
    }

    loadAudio(file);
  };

  /**
   * Set canvas size to full screen
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
   * Initialize boids when canvas size changes
   */
  useEffect(() => {
    if (canvasSize.width && canvasSize.height) {
      // Create flock with dynamic count based on treble
      const boidCount = 80 + Math.floor(frequencies.treble / 2);
      boidsRef.current = createFlock(Math.min(boidCount, 150), canvasSize.width, canvasSize.height);
    }
  }, [canvasSize.width, canvasSize.height]);

  /**
   * Main visualization loop - THIS IS WHERE THE MAGIC HAPPENS
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationId;

    const draw = () => {
      const { width, height } = canvas;
      const centerX = width / 2;
      const centerY = height / 2;

      // Dark background with slight fade for trails
      ctx.fillStyle = 'rgba(5, 5, 10, 0.15)';
      ctx.fillRect(0, 0, width, height);

      // ===== BACKGROUND GLOW (Sub-bass) =====
      // Subtle full-screen glow that pulses with sub-bass
      if (frequencies.subBass > 20) {
        const glowRadius = Math.max(width, height);
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
        gradient.addColorStop(0, `rgba(80, 20, 120, ${frequencies.subBass / 400})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      // ===== CENTRAL BASS VISUALIZATION =====
      // Pulsing center with bass
      const bassRadius = 30 + (frequencies.bass * 3);
      const bassColor = `hsl(${340 - frequencies.bass * 0.5}, 80%, 50%)`; // Red to orange

      // Outer rings (low mids)
      if (frequencies.lowMids > 10) {
        const ringCount = Math.floor(frequencies.lowMids / 15);
        for (let i = 0; i < ringCount; i++) {
          ctx.strokeStyle = `hsla(${20 + i * 10}, 70%, 50%, ${0.3 - i * 0.05})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(centerX, centerY, bassRadius + (i + 1) * 40, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Main bass circle
      ctx.shadowBlur = 50;
      ctx.shadowColor = bassColor;
      ctx.fillStyle = bassColor;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(centerX, centerY, bassRadius, 0, Math.PI * 2);
      ctx.fill();

      // Inner bright core
      ctx.globalAlpha = 1;
      const coreGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, bassRadius * 0.6);
      coreGradient.addColorStop(0, '#ffffff');
      coreGradient.addColorStop(1, bassColor);
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, bassRadius * 0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // ===== RADIAL FREQUENCY BARS (Mids) =====
      // Bars radiating from center, controlled by mids
      const barCount = 32;
      const barDistance = bassRadius + 100;

      for (let i = 0; i < barCount; i++) {
        const angle = (Math.PI * 2 / barCount) * i + rotationRef.current * 0.5;

        // Use different frequency bands for different bars
        const freqIndex = i % 8;
        const freqValues = [
          frequencies.subBass,
          frequencies.bass,
          frequencies.lowMids,
          frequencies.mids,
          frequencies.highMids,
          frequencies.presence,
          frequencies.brilliance,
          frequencies.treble
        ];
        const barHeight = freqValues[freqIndex] * 2;

        if (barHeight > 5) {
          const x1 = centerX + Math.cos(angle) * barDistance;
          const y1 = centerY + Math.sin(angle) * barDistance;
          const x2 = centerX + Math.cos(angle) * (barDistance + barHeight);
          const y2 = centerY + Math.sin(angle) * (barDistance + barHeight);

          const hue = (freqIndex / 8) * 120 + 180; // Blue to purple range
          ctx.strokeStyle = `hsla(${hue}, 80%, 60%, 0.7)`;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      // ===== BOIDS FLOCK (Treble & Presence) =====
      // Flocking particles that respond to high frequencies
      if (boidsRef.current) {
        // Add/remove boids based on brilliance
        const targetBoidCount = 80 + Math.floor(frequencies.brilliance / 2);
        const currentCount = boidsRef.current.length;

        if (currentCount < targetBoidCount && currentCount < 150) {
          // Add boids
          for (let i = 0; i < Math.min(5, targetBoidCount - currentCount); i++) {
            const Boid = boidsRef.current[0].constructor;
            boidsRef.current.push(new Boid(
              Math.random() * width,
              Math.random() * height,
              width,
              height
            ));
          }
        } else if (currentCount > targetBoidCount && currentCount > 30) {
          // Remove boids
          boidsRef.current.splice(0, Math.min(5, currentCount - targetBoidCount));
        }

        // Update and render all boids
        for (const boid of boidsRef.current) {
          boid.update(boidsRef.current, frequencies);
          boid.render(ctx, 0.8);
        }
      }

      // ===== ORBITING PARTICLES (High Mids) =====
      // Particles that orbit the center, controlled by high mids
      if (frequencies.highMids > 15) {
        const particleCount = Math.floor(frequencies.highMids / 3);
        const orbitRadius = bassRadius + 200;

        for (let i = 0; i < particleCount; i++) {
          const angle = (Math.PI * 2 / particleCount) * i + rotationRef.current;
          const x = centerX + Math.cos(angle) * orbitRadius;
          const y = centerY + Math.sin(angle) * orbitRadius;

          ctx.fillStyle = `hsla(${120 + frequencies.highMids}, 80%, 60%, 0.6)`;
          ctx.shadowBlur = 10;
          ctx.shadowColor = ctx.fillStyle;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      }

      // Update rotation
      const rotationSpeed = 0.001 + (frequencies.mids * 0.0001);
      rotationRef.current += rotationSpeed;

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
  }, [frequencies, canvasSize]);

  // ===== AUTO-HIDE CONTROLS =====
  useEffect(() => {
    if (isPlaying || isMicActive) {
      const timer = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isPlaying, isMicActive]);

  // ===== RENDER UI =====
  return (
    <div className="app">
      {/* Full-screen canvas */}
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="visualization-canvas"
      />

      {/* Minimal controls overlay */}
      <div
        className={`controls-minimal ${controlsVisible ? 'visible' : 'hidden'}`}
        onMouseEnter={() => setControlsVisible(true)}
      >
        <div className="controls-compact">
          {/* Microphone button */}
          <button onClick={toggleMicrophone} className="control-btn mic" title="Use Microphone">
            {isMicActive ? '🎤' : '🎤'}
          </button>

          {/* File upload */}
          <label htmlFor="audio-upload" className="control-btn upload" title="Upload Audio">
            📁
            <input
              id="audio-upload"
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="file-input"
            />
          </label>

          {/* Play/Pause (only show when file is loaded) */}
          {hasAudio && !isMicActive && (
            <button onClick={togglePlayPause} className="control-btn play" title={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? '⏸' : '▶'}
            </button>
          )}

          {/* Toggle visibility */}
          <button
            onClick={() => setControlsVisible(false)}
            className="control-btn hide"
            title="Hide Controls"
          >
            ✕
          </button>
        </div>

        {/* Error display */}
        {error && (
          <div className="error-compact">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Show controls button (when hidden) */}
      {!controlsVisible && (
        <button
          className="show-controls-btn"
          onClick={() => setControlsVisible(true)}
          title="Show Controls"
        >
          ⚙️
        </button>
      )}

      {/* Back link - always visible in corner */}
      <a href="/" className="back-link-minimal">
        ← Home
      </a>
    </div>
  );
}

export default App;
