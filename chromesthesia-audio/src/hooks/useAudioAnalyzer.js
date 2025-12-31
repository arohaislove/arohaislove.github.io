import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Custom hook for audio analysis and visualization
 *
 * This hook handles ALL the Web Audio API complexity and gives you simple data:
 * - bass: 0-100 (how much low-frequency sound)
 * - mids: 0-100 (how much mid-frequency sound)
 * - treble: 0-100 (how much high-frequency sound)
 *
 * WHY WE NEED THIS:
 * - Web Audio API is powerful but complicated
 * - We want to hide that complexity from the main component
 * - Makes debugging easier (all audio logic is in one place)
 */
export function useAudioAnalyzer() {
  // ===== STATE =====
  // These track the current state of our audio system
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [error, setError] = useState(null);

  // Current frequency band values (updated ~60 times per second)
  const [frequencies, setFrequencies] = useState({
    bass: 0,
    mids: 0,
    treble: 0
  });

  // ===== REFS =====
  // These persist across re-renders but don't cause re-renders when changed
  // WHY REFS? Because Web Audio objects should not trigger React re-renders

  const audioContextRef = useRef(null);  // The main audio processing engine
  const analyserRef = useRef(null);      // Analyzes frequency data
  const sourceRef = useRef(null);        // Connects audio source to analyzer
  const audioElementRef = useRef(null);  // The actual <audio> HTML element
  const animationFrameRef = useRef(null); // ID for canceling animation loop
  const dataArrayRef = useRef(null);     // Holds raw frequency data from analyzer
  const mediaStreamRef = useRef(null);   // Holds microphone media stream

  /**
   * Initialize the Web Audio API context and analyzer
   *
   * WHY THIS IS SEPARATE:
   * - Audio contexts can only start after user interaction (browser security)
   * - We create it once and reuse it for all audio files
   * - If we create too many contexts, browser performance suffers
   */
  const initializeAudioContext = useCallback(() => {
    // If we already have a context, don't create another one
    if (audioContextRef.current) return;

    try {
      // Create the audio context (the "engine" for all audio processing)
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Create an analyzer node
      // This is what actually reads frequency data from the audio
      const analyser = audioContext.createAnalyser();

      // FFT size determines frequency resolution
      // 2048 = good balance between detail and performance
      // WHY 2048?
      // - Higher = more detail but slower
      // - Lower = faster but less accurate
      // - Must be a power of 2 (256, 512, 1024, 2048, 4096, etc.)
      analyser.fftSize = 2048;

      // Smoothing makes the visualization less "jumpy"
      // 0.8 = heavy smoothing (smooth but slightly delayed)
      // 0 = no smoothing (very responsive but jittery)
      analyser.smoothingTimeConstant = 0.8;

      // Create an array to hold frequency data
      // The analyzer will write frequency values into this array
      const bufferLength = analyser.frequencyBinCount; // How many frequency "bins" we get
      const dataArray = new Uint8Array(bufferLength);  // Values will be 0-255

      // Store everything in refs so we can access later
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;

      setError(null);
    } catch (err) {
      setError('Failed to initialize audio system: ' + err.message);
      console.error('Audio context initialization failed:', err);
    }
  }, []);

  /**
   * Load an audio file and connect it to our analyzer
   *
   * @param {File} file - The audio file from file input
   */
  const loadAudio = useCallback((file) => {
    // Make sure we have an audio context first
    initializeAudioContext();

    if (!audioContextRef.current || !analyserRef.current) {
      setError('Audio system not initialized');
      return;
    }

    try {
      // Stop any currently playing audio
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }

      // Disconnect old source if it exists
      // WHY? Prevents audio connections from piling up
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }

      // Create a URL for the file so we can load it in an <audio> element
      // This is a temporary URL that points to the file in memory
      const audioUrl = URL.createObjectURL(file);

      // Create an HTML audio element (same as <audio> tag in HTML)
      const audio = new Audio(audioUrl);

      // Set CORS to allow audio analysis
      // WHY? Browsers block analysis of audio from other domains for security
      audio.crossOrigin = 'anonymous';

      // Store reference to the audio element
      audioElementRef.current = audio;

      // Create a source node from the audio element
      // This lets us connect the <audio> element to Web Audio API
      const source = audioContextRef.current.createMediaElementSource(audio);

      // Connect the audio pipeline:
      // source → analyzer → destination (speakers)
      // WHY THIS ORDER?
      // - Analyzer sits in the middle so it can "listen" to the audio
      // - Audio still goes to speakers so you can hear it
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);

      sourceRef.current = source;
      setHasAudio(true);
      setError(null);

      // Auto-play the audio (user just loaded it, they want to hear it)
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          setError('Failed to play audio: ' + err.message);
          console.error('Playback failed:', err);
        });

    } catch (err) {
      setError('Failed to load audio file: ' + err.message);
      console.error('Audio loading failed:', err);
    }
  }, [initializeAudioContext]);

  /**
   * Analyze frequency data and update state
   *
   * WHY THIS IS THE CORE FUNCTION:
   * - This runs ~60 times per second via requestAnimationFrame
   * - Reads raw frequency data and simplifies it to 3 bands
   * - Updates React state so component can re-render with new values
   */
  const analyzeFrequencies = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    // Get the current frequency data from the analyser
    // This fills dataArray with values 0-255 for each frequency bin
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    const dataArray = dataArrayRef.current;
    const bufferLength = dataArray.length;

    // FREQUENCY BANDS EXPLANATION:
    // The dataArray contains ~1024 values (half of fftSize)
    // Each value represents a narrow frequency range
    // We divide this into 3 bands:

    // BASS: Low frequencies (roughly 20Hz - 250Hz)
    // Index 0 to 1/6 of the array
    const bassEnd = Math.floor(bufferLength / 6);
    let bassSum = 0;
    for (let i = 0; i < bassEnd; i++) {
      bassSum += dataArray[i];
    }
    const bassAvg = bassSum / bassEnd;

    // MIDS: Middle frequencies (roughly 250Hz - 4000Hz)
    // Index 1/6 to 2/3 of the array
    const midsEnd = Math.floor(bufferLength * 2 / 3);
    let midsSum = 0;
    for (let i = bassEnd; i < midsEnd; i++) {
      midsSum += dataArray[i];
    }
    const midsAvg = midsSum / (midsEnd - bassEnd);

    // TREBLE: High frequencies (roughly 4000Hz - 20000Hz)
    // Index 2/3 to end of array
    let trebleSum = 0;
    for (let i = midsEnd; i < bufferLength; i++) {
      trebleSum += dataArray[i];
    }
    const trebleAvg = trebleSum / (bufferLength - midsEnd);

    // Normalize to 0-100 range
    // WHY? Easier to work with than 0-255, and matches percentage mental model
    setFrequencies({
      bass: Math.round((bassAvg / 255) * 100),
      mids: Math.round((midsAvg / 255) * 100),
      treble: Math.round((trebleAvg / 255) * 100)
    });

    // Continue the animation loop
    // This makes analyzeFrequencies run again on the next frame (~60 FPS)
    animationFrameRef.current = requestAnimationFrame(analyzeFrequencies);
  }, []);

  /**
   * Start the frequency analysis loop
   */
  const startAnalyzing = useCallback(() => {
    // Cancel any existing loop first (prevents multiple loops running)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    // Start the new loop
    analyzeFrequencies();
  }, [analyzeFrequencies]);

  /**
   * Stop the frequency analysis loop
   */
  const stopAnalyzing = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    // Reset frequencies to zero when stopped
    setFrequencies({ bass: 0, mids: 0, treble: 0 });
  }, []);

  /**
   * Play/pause toggle
   */
  const togglePlayPause = useCallback(() => {
    if (!audioElementRef.current) return;

    if (isPlaying) {
      audioElementRef.current.pause();
      stopAnalyzing();
      setIsPlaying(false);
    } else {
      // Resume audio context if it's suspended
      // WHY? Browsers suspend audio contexts to save resources
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }

      audioElementRef.current.play()
        .then(() => {
          startAnalyzing();
          setIsPlaying(true);
        })
        .catch(err => {
          setError('Failed to play: ' + err.message);
        });
    }
  }, [isPlaying, startAnalyzing, stopAnalyzing]);

  /**
   * Start microphone input
   *
   * HOW THIS WORKS:
   * 1. Request microphone permission from the browser
   * 2. Get a media stream from the microphone
   * 3. Create a MediaStreamSource node
   * 4. Connect it to the analyzer
   * 5. Start the visualization loop
   *
   * WHY THIS IS COOL:
   * - Visualize any sound around you in real-time
   * - Works with system audio if you play Spotify/YouTube in another tab
   * - Great for live music, singing, talking
   */
  const startMicrophone = useCallback(async () => {
    // Stop any playing audio file first
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    }

    // Initialize audio context if needed
    initializeAudioContext();

    if (!audioContextRef.current || !analyserRef.current) {
      setError('Audio system not initialized');
      return;
    }

    try {
      // Request microphone access from the browser
      // This will show a permission dialog
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,  // We want raw audio
          noiseSuppression: false,  // Don't filter out frequencies
          autoGainControl: false    // Keep original volume levels
        }
      });

      // Disconnect old source if it exists
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }

      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Create a source from the microphone stream
      const micSource = audioContextRef.current.createMediaStreamSource(stream);

      // Connect mic → analyzer
      // NOTE: We don't connect to destination (speakers) to avoid feedback!
      micSource.connect(analyserRef.current);

      // Store references
      sourceRef.current = micSource;
      mediaStreamRef.current = stream;

      // Update state
      setIsMicActive(true);
      setHasAudio(true);
      setError(null);

      // Start the visualization
      startAnalyzing();

    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone permission denied. Please allow microphone access.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone.');
      } else {
        setError('Failed to start microphone: ' + err.message);
      }
      console.error('Microphone error:', err);
    }
  }, [initializeAudioContext, startAnalyzing]);

  /**
   * Stop microphone input
   *
   * WHY WE NEED THIS:
   * - Properly release the microphone resource
   * - Turn off the microphone indicator in the browser
   * - Stop the visualization
   */
  const stopMicrophone = useCallback(() => {
    // Stop all tracks in the media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Disconnect the source
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }

    // Stop the visualization
    stopAnalyzing();

    // Update state
    setIsMicActive(false);
    setHasAudio(false);
  }, [stopAnalyzing]);

  /**
   * Toggle microphone on/off
   */
  const toggleMicrophone = useCallback(() => {
    if (isMicActive) {
      stopMicrophone();
    } else {
      startMicrophone();
    }
  }, [isMicActive, startMicrophone, stopMicrophone]);

  // ===== CLEANUP =====
  // Stop analyzing when component unmounts
  // WHY? Prevents memory leaks and unnecessary CPU usage
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      // Stop microphone if active
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Return everything the component needs
  return {
    // State
    frequencies,      // { bass: 0-100, mids: 0-100, treble: 0-100 }
    isPlaying,        // true/false
    hasAudio,         // true if a file is loaded
    isMicActive,      // true if microphone is active
    error,            // error message or null

    // Functions
    loadAudio,        // (file) => load and connect audio file
    togglePlayPause,  // () => play or pause
    toggleMicrophone, // () => start or stop microphone
  };
}
