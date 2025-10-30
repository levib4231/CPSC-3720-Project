import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import VoiceInputButton from "./VoiceInputButton";

/**
 * Unit tests for VoiceInputButton component
 *
 * Tests cover:
 * - Browser support detection and fallback
 * - Button states (idle, listening, processing)
 * - Voice recognition lifecycle
 * - Transcript callbacks
 * - Accessibility features
 */

describe("VoiceInputButton", () => {
  let mockRecognition;
  let originalSpeechRecognition;
  let originalAudioContext;

  beforeEach(() => {
    // Mock SpeechRecognition
    mockRecognition = {
      start: jest.fn(),
      stop: jest.fn(),
      abort: jest.fn(),
      continuous: false,
      interimResults: false,
      maxAlternatives: 1,
      lang: "en-US",
      onstart: null,
      onresult: null,
      onspeechend: null,
      onerror: null,
      onend: null,
    };

    originalSpeechRecognition = window.SpeechRecognition;
    window.SpeechRecognition = jest.fn(() => mockRecognition);

    // Mock AudioContext (for beep sound)
    const mockOscillator = {
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      type: "sine",
      frequency: {
        setValueAtTime: jest.fn(),
      },
    };

    const mockGainNode = {
      connect: jest.fn(),
      gain: {
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
      },
    };

    const mockAudioContext = {
      createOscillator: jest.fn(() => mockOscillator),
      createGain: jest.fn(() => mockGainNode),
      destination: {},
      currentTime: 0,
      close: jest.fn(),
    };

    originalAudioContext = window.AudioContext;
    window.AudioContext = jest.fn(() => mockAudioContext);
  });

  afterEach(() => {
    // Restore original implementations
    window.SpeechRecognition = originalSpeechRecognition;
    window.AudioContext = originalAudioContext;
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe("Browser Support", () => {
    it("renders enabled button when SpeechRecognition is supported", () => {
      render(<VoiceInputButton onTranscript={jest.fn()} />);

      const button = screen.getByRole("button", { name: /start voice input/i });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it("renders disabled button with tooltip when SpeechRecognition is not supported", () => {
      // Remove SpeechRecognition support
      window.SpeechRecognition = undefined;
      window.webkitSpeechRecognition = undefined;

      render(<VoiceInputButton onTranscript={jest.fn()} />);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute(
        "title",
        "Voice input not supported in this browser"
      );
    });
  });

  describe("Button States", () => {
    it("shows idle state by default", () => {
      render(<VoiceInputButton onTranscript={jest.fn()} />);

      const button = screen.getByRole("button", { name: /start voice input/i });
      expect(button).toHaveAttribute("aria-pressed", "false");
    });

    it("shows listening state when recording", async () => {
      jest.useFakeTimers();

      render(<VoiceInputButton onTranscript={jest.fn()} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      // Advance timers to start recognition (after beep delay)
      jest.advanceTimersByTime(150);

      // Trigger onstart event
      await waitFor(() => {
        if (mockRecognition.onstart) {
          mockRecognition.onstart();
        }
      });

      await waitFor(() => {
        expect(button).toHaveAttribute("aria-label", "Stop voice input");
      });
      await waitFor(() => {
        expect(button).toHaveAttribute("aria-pressed", "true");
      });

      jest.useRealTimers();
    });

    it("shows processing state after speech ends", async () => {
      jest.useFakeTimers();

      render(<VoiceInputButton onTranscript={jest.fn()} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      jest.advanceTimersByTime(150);

      // Trigger onstart
      if (mockRecognition.onstart) {
        mockRecognition.onstart();
      }

      await waitFor(() => {
        expect(button).toHaveAttribute("aria-pressed", "true");
      });

      // Trigger onspeechend
      if (mockRecognition.onspeechend) {
        mockRecognition.onspeechend();
      }

      await waitFor(() => {
        expect(button).toHaveAttribute(
          "aria-label",
          "Processing voice input"
        );
      });

      jest.useRealTimers();
    });
  });

  describe("Voice Recognition Lifecycle", () => {
    it("plays beep and starts recognition when clicked", async () => {
      jest.useFakeTimers();

      render(<VoiceInputButton onTranscript={jest.fn()} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      // Verify beep was triggered (AudioContext created)
      expect(window.AudioContext).toHaveBeenCalled();

      // Advance timers to trigger recognition start
      jest.advanceTimersByTime(150);

      await waitFor(() => {
        expect(mockRecognition.start).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });

    it("stops recognition when clicked while listening", async () => {
      jest.useFakeTimers();

      render(<VoiceInputButton onTranscript={jest.fn()} />);

      const button = screen.getByRole("button");

      // Start listening
      fireEvent.click(button);
      jest.advanceTimersByTime(150);

      if (mockRecognition.onstart) {
        mockRecognition.onstart();
      }

      await waitFor(() => {
        expect(button).toHaveAttribute("aria-pressed", "true");
      });

      // Stop listening
      fireEvent.click(button);

      expect(mockRecognition.stop).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it("handles keyboard events (Space and Enter)", async () => {
      jest.useFakeTimers();

      render(<VoiceInputButton onTranscript={jest.fn()} />);

      const button = screen.getByRole("button");

      // Test Enter key
      fireEvent.keyDown(button, { key: "Enter" });
      jest.advanceTimersByTime(150);

      await waitFor(() => {
        expect(mockRecognition.start).toHaveBeenCalled();
      });

      // Reset
      if (mockRecognition.onend) {
        mockRecognition.onend();
      }
      jest.clearAllMocks();

      // Test Space key
      fireEvent.keyDown(button, { key: " " });
      jest.advanceTimersByTime(150);

      await waitFor(() => {
        expect(mockRecognition.start).toHaveBeenCalled();
      });

      jest.useRealTimers();
    });
  });

  describe("Transcript Callbacks", () => {
    it("calls onTranscript with final recognized text", async () => {
      jest.useFakeTimers();

      const onTranscript = jest.fn();
      render(<VoiceInputButton onTranscript={onTranscript} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);
      jest.advanceTimersByTime(150);

      // Trigger onstart
      if (mockRecognition.onstart) {
        mockRecognition.onstart();
      }

      // Simulate final result
      const mockEvent = {
        results: [
          [
            {
              transcript: "Hello, I want to book a ticket",
              confidence: 0.95,
            },
          ],
        ],
      };
      mockEvent.results[0].isFinal = true;

      if (mockRecognition.onresult) {
        mockRecognition.onresult(mockEvent);
      }

      await waitFor(() => {
        expect(onTranscript).toHaveBeenCalledWith(
          "Hello, I want to book a ticket"
        );
      });

      jest.useRealTimers();
    });

    it("calls onInterim with interim text when provided", async () => {
      jest.useFakeTimers();

      const onInterim = jest.fn();
      render(
        <VoiceInputButton onTranscript={jest.fn()} onInterim={onInterim} />
      );

      const button = screen.getByRole("button");
      fireEvent.click(button);
      jest.advanceTimersByTime(150);

      if (mockRecognition.onstart) {
        mockRecognition.onstart();
      }

      // Simulate interim result
      const mockEvent = {
        results: [
          [
            {
              transcript: "Hello",
              confidence: 0.8,
            },
          ],
        ],
      };
      mockEvent.results[0].isFinal = false;

      if (mockRecognition.onresult) {
        mockRecognition.onresult(mockEvent);
      }

      await waitFor(() => {
        expect(onInterim).toHaveBeenCalledWith("Hello");
      });

      jest.useRealTimers();
    });

    it("does not call onTranscript with empty transcript", async () => {
      jest.useFakeTimers();

      const onTranscript = jest.fn();
      render(<VoiceInputButton onTranscript={onTranscript} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);
      jest.advanceTimersByTime(150);

      if (mockRecognition.onstart) {
        mockRecognition.onstart();
      }

      // Simulate empty result
      const mockEvent = {
        results: [
          [
            {
              transcript: "   ",
              confidence: 0.5,
            },
          ],
        ],
      };
      mockEvent.results[0].isFinal = true;

      if (mockRecognition.onresult) {
        mockRecognition.onresult(mockEvent);
      }

      // Wait a bit to ensure callback is not called
      await waitFor(() => {
        expect(onTranscript).not.toHaveBeenCalled();
      });

      jest.useRealTimers();
    });
  });

  describe("Error Handling", () => {
    it("shows error message when microphone permission is denied", async () => {
      jest.useFakeTimers();

      render(<VoiceInputButton onTranscript={jest.fn()} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);
      jest.advanceTimersByTime(150);

      // Trigger permission error
      if (mockRecognition.onerror) {
        mockRecognition.onerror({ error: "not-allowed" });
      }

      await waitFor(() => {
        expect(
          screen.getByText("Microphone permission denied.")
        ).toBeInTheDocument();
      });

      jest.useRealTimers();
    });

    it("shows error message when no speech is detected", async () => {
      jest.useFakeTimers();

      render(<VoiceInputButton onTranscript={jest.fn()} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);
      jest.advanceTimersByTime(150);

      // Trigger no-speech error
      if (mockRecognition.onerror) {
        mockRecognition.onerror({ error: "no-speech" });
      }

      await waitFor(() => {
        expect(
          screen.getByText("No speech detected. Please try again.")
        ).toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels", () => {
      render(<VoiceInputButton onTranscript={jest.fn()} />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-label", "Start voice input");
      expect(button).toHaveAttribute("aria-pressed", "false");
    });

    it("accepts custom aria-label", () => {
      render(
        <VoiceInputButton
          onTranscript={jest.fn()}
          ariaLabel="Record message"
        />
      );

      const button = screen.getByRole("button", { name: /record message/i });
      expect(button).toBeInTheDocument();
    });

    it("respects disabled prop", () => {
      render(<VoiceInputButton onTranscript={jest.fn()} disabled={true} />);

      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("applies custom className", () => {
      render(
        <VoiceInputButton onTranscript={jest.fn()} className="custom-class" />
      );

      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
    });
  });

  describe("Cleanup", () => {
    it("aborts recognition on unmount", () => {
      jest.useFakeTimers();

      const { unmount } = render(<VoiceInputButton onTranscript={jest.fn()} />);

      const button = screen.getByRole("button");
      fireEvent.click(button);
      jest.advanceTimersByTime(150);

      if (mockRecognition.onstart) {
        mockRecognition.onstart();
      }

      unmount();

      expect(mockRecognition.abort).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });
});

