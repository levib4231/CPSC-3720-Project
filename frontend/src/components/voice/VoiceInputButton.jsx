import { useState, useRef, useEffect } from "react";

/**
 * VoiceInputButton Component
 *
 * A self-contained microphone button that captures voice input using the Web Speech API.
 * Features:
 * - Plays a short beep before recording
 * - Shows visual states (idle, listening, processing)
 * - Provides interim and final transcripts via callbacks
 * - Fully accessible (keyboard, ARIA labels, focus states)
 * - Graceful fallback for unsupported browsers
 */
export default function VoiceInputButton({
  onTranscript,
  onInterim,
  lang = "en-US",
  className = "",
  disabled = false,
  ariaLabel = "Start voice input",
}) {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);

  // Check browser support on mount
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  /**
   * Play a short beep using Web Audio API
   * Duration: ~100ms, Frequency: 880 Hz (A5 note)
   */
  const playBeep = () => {
    try {
      // Create or reuse audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configure oscillator
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);

      // Configure gain envelope to avoid clicks
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        0.1,
        audioContext.currentTime + 0.01
      ); // Fade in
      gainNode.gain.linearRampToValueAtTime(
        0.1,
        audioContext.currentTime + 0.09
      ); // Hold
      gainNode.gain.linearRampToValueAtTime(
        0,
        audioContext.currentTime + 0.1
      ); // Fade out

      // Play beep
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (err) {
      console.warn("Failed to play beep:", err);
      // Non-critical error, continue with recording
    }
  };

  /**
   * Start voice recognition
   */
  const startRecognition = () => {
    if (!isSupported || disabled || isListening) return;

    setError(null);

    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      // Configure recognition
      recognition.continuous = false; // Stop after user finishes speaking
      recognition.interimResults = true; // Get interim results for better UX
      recognition.maxAlternatives = 1;
      recognition.lang = lang;

      // Event handlers
      recognition.onstart = () => {
        setIsListening(true);
        setIsProcessing(false);
        if (process.env.NODE_ENV === "development") {
          console.log("Voice recognition started");
        }
      };

      recognition.onresult = (event) => {
        const results = event.results;
        const lastResult = results[results.length - 1];

        if (lastResult.isFinal) {
          // Final transcript
          const transcript = lastResult[0].transcript;
          if (process.env.NODE_ENV === "development") {
            console.log("Final transcript:", transcript);
          }
          if (onTranscript && transcript.trim()) {
            onTranscript(transcript);
          }
        } else if (onInterim) {
          // Interim transcript
          const interimTranscript = lastResult[0].transcript;
          console.log("Interim transcript:", interimTranscript);
          onInterim(interimTranscript);
        }
      };

      recognition.onspeechend = () => {
        if (process.env.NODE_ENV === "development") {
          console.log("Speech ended");
        }
        setIsListening(false);
        setIsProcessing(true);
      };

      recognition.onerror = (event) => {
        if (process.env.NODE_ENV === "development") {
          console.error("Speech recognition error:", event.error);
        }

        let errorMessage = "Voice input failed. Please try again.";
        switch (event.error) {
          case "no-speech":
            errorMessage = "No speech detected. Please try again.";
            break;
          case "audio-capture":
            errorMessage = "Microphone not accessible.";
            break;
          case "not-allowed":
            errorMessage = "Microphone permission denied.";
            break;
          case "network":
            errorMessage = "Network error. Please check your connection.";
            break;
          default:
            break;
        }

        setError(errorMessage);
        setIsListening(false);
        setIsProcessing(false);
      };

      recognition.onend = () => {
        if (process.env.NODE_ENV === "development") {
          console.log("Voice recognition ended");
        }
        setIsListening(false);
        setIsProcessing(false);
        recognitionRef.current = null;
      };

      // Play beep, then start recognition
      playBeep();

      // Start recognition after beep completes (~100ms)
      setTimeout(() => {
        recognition.start();
      }, 150);
    } catch (err) {
      console.error("Failed to start recognition:", err);
      setError("Failed to start voice input.");
      setIsListening(false);
      setIsProcessing(false);
    }
  };

  /**
   * Stop voice recognition
   */
  const stopRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  /**
   * Toggle voice input on/off
   */
  const handleClick = () => {
    if (isListening) {
      stopRecognition();
    } else {
      startRecognition();
    }
  };

  /**
   * Handle keyboard events (Space/Enter)
   */
  const handleKeyDown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleClick();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Determine button state and styling
  const isButtonDisabled = !isSupported || disabled || isProcessing;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        aria-label={
          isListening
            ? "Stop voice input"
            : isProcessing
            ? "Processing voice input"
            : ariaLabel
        }
        aria-pressed={isListening}
        disabled={isButtonDisabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`
          relative px-3 py-2 rounded-lg transition-all duration-200
          ${
            isButtonDisabled
              ? "bg-gray-300 cursor-not-allowed text-gray-500"
              : isListening
              ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
              : "bg-gray-500 hover:bg-gray-600 text-white"
          }
          ${className}
        `}
        title={
          !isSupported
            ? "Voice input not supported in this browser"
            : isProcessing
            ? "Processing..."
            : ""
        }
      >
        {/* Microphone Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5"
          aria-hidden="true"
        >
          {isListening ? (
            // Recording icon (filled mic)
            <path d="M12 2a4 4 0 0 1 4 4v6a4 4 0 1 1-8 0V6a4 4 0 0 1 4-4zM3.055 11H5a7 7 0 0 0 14 0h1.945c-.502 5.053-4.765 9-9.945 9-5.18 0-9.443-3.947-9.945-9zM11 21h2v2h-2z" />
          ) : (
            // Default mic icon
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zm-1 3a1 1 0 1 1 2 0v8a1 1 0 1 1-2 0V4zm-4 7a5 5 0 0 0 10 0h2a7 7 0 0 1-14 0h2zm5 10v-2.058a7 7 0 0 0 0-.882V21h-2v-2h2v2z" />
          )}
        </svg>

        {/* Status indicator for screen readers */}
        {isListening && (
          <span className="sr-only" aria-live="polite">
            Listening… press to stop
          </span>
        )}
        {isProcessing && (
          <span className="sr-only" aria-live="polite">
            Processing…
          </span>
        )}
      </button>

      {/* Error message tooltip */}
      {error && (
        <div
          role="alert"
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-red-600 text-white text-sm rounded shadow-lg whitespace-nowrap z-10"
        >
          {error}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-red-600"></div>
        </div>
      )}

      {/* Unsupported browser tooltip */}
      {!isSupported && (
        <div
          role="status"
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-700 text-white text-xs rounded shadow-lg whitespace-nowrap z-10"
        >
          Voice input not supported in this browser
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-700"></div>
        </div>
      )}
    </div>
  );
}

