/**
 * Test Suite: VoiceInputButton Component
 * ---------------------------------------------------------
 * Purpose:
 *   Tests the VoiceInputButton component's ability to record audio,
 *   produce a transcript, and invoke the provided callback function.
 *
 * Dependencies:
 *   - @testing-library/react
 *   - VoiceInputButton component
 * ---------------------------------------------------------
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import VoiceInputButton from "../components/voice/VoiceInputButton";

// Extend default Jest timeout for longer voice recording simulations
jest.setTimeout(15000);

/**
 * @function testVoiceInputButtonTranscriptCallback
 * @description Simulates a user clicking the VoiceInputButton, ensures
 *   the mock voice recognition fires, a transcript is generated, and
 *   the onTranscript callback is invoked with expected content.
 *
 * @returns {void}
 *
 * @sideEffects Uses fake timers to control asynchronous mock recognition.
 */
test("records and shows transcript then invokes callback", async () => {
  // Use fake timers to control asynchronous recognition behavior
  jest.useFakeTimers();

  // Mock callback function for transcript handling
  const onTranscriptMock = jest.fn();

  render(<VoiceInputButton onTranscript={onTranscriptMock} />);

  // Locate the voice input button by accessible role and name
  const voiceButton = screen.getByRole("button", { name: /voice|start/i });

  // Simulate user clicking the button and advance timers to trigger mock recognition
  await act(async () => {
    fireEvent.click(voiceButton);

    // Advance timers to simulate recognition delay
    jest.advanceTimersByTime(100);
  });

  // Wait for the transcript callback to be invoked
  await waitFor(() => {
    // Verify the callback was called
    expect(onTranscriptMock).toHaveBeenCalled();

    // Verify the transcript contains expected text
    expect(onTranscriptMock.mock.calls[0][0]).toMatch(/Jazz Night/);
  });

  // Restore real timers after the test
  jest.useRealTimers();
});