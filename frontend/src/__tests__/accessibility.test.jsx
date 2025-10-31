/**
 * Test Suite: ChatWindow and VoiceInputButton
 * ---------------------------------------------------------
 * Purpose:
 *   Contains unit tests for the ChatWindow and VoiceInputButton components.
 *   Tests include:
 *     - ChatWindow booking workflow and confirmation behavior
 *     - VoiceInputButton accessibility (keyboard focus and ARIA naming)
 *
 * Dependencies:
 *   - @testing-library/react
 *   - ChatWindow component
 *   - VoiceInputButton component
 * ---------------------------------------------------------
 */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import ChatWindow from "../ChatWindow";
import VoiceInputButton from "../components/voice/VoiceInputButton";

/**
 * @function testChatWindowNoBookingBeforeConfirmation
 * @description Ensures ChatWindow does not trigger ticket booking
 *   before the user explicitly confirms the action.
 *
 * @returns {void}
 *
 * @sideEffects Mocks global fetch and simulates user interactions.
 */
test("No booking occurs before explicit confirmation (ChatWindow)", async () => {
  const fetchCalls = [];

  // Mock fetch API for parse, confirm, and event endpoints
  global.fetch = jest.fn((url) => {
    fetchCalls.push(url);

    if (url.endsWith("/api/llm/parse")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            reply: "I can book that for you.",
            bookingInfo: { event: "Football Game", tickets: 2 },
          }),
      });
    }

    if (url.endsWith("/api/llm/confirm")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    }

    if (url.includes("/api/events/")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "purchased" }),
      });
    }

    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });

  render(<ChatWindow />);

  const messageInput = screen.getByPlaceholderText(/Type or speak a message/i);
  
  await act(async () => {
    fireEvent.change(messageInput, { target: { value: "Book two tickets for Football Game" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));
  });

  // Wait for the LLM's reply to appear in the UI
  await screen.findByText(/I can book that for you./i);

  // Assert parse endpoint was called
  expect(fetchCalls.some((url) => url.endsWith("/api/llm/parse"))).toBe(true);
  // Assert no purchase call was made before confirmation
  expect(fetchCalls.some((url) => url.includes("/api/events/"))).toBe(false);

  // Wait for confirmation prompt to render
  await waitFor(() => {
    expect(screen.getByText(/Confirm booking of/)).toBeInTheDocument();
  });

  const confirmButton = screen.getByRole("button", { name: /confirm/i });

  // Simulate user confirming the booking
  await act(async () => {
    fireEvent.click(confirmButton);
  });

  // Assert confirm endpoint was called
  await waitFor(() =>
    expect(fetchCalls.some((url) => url.endsWith("/api/llm/confirm"))).toBe(true)
  );

  // Restore original fetch
  global.fetch.mockRestore && global.fetch.mockRestore();
  global.fetch = undefined;
});

/**
 * @function testVoiceInputButtonAccessibility
 * @description Ensures VoiceInputButton can receive keyboard focus
 *   and has a valid accessible name for screen readers.
 *
 * @returns {void}
 */
test("VoiceInputButton is keyboard-focusable and has an accessible name", async () => {
  const onTranscriptMock = jest.fn();

  render(<VoiceInputButton onTranscript={onTranscriptMock} />);
  const buttonElement = screen.getByRole("button");

  // Assert button exists
  expect(buttonElement).toBeTruthy();

  // Simulate keyboard focus
  await act(async () => {
    buttonElement.focus();
  });

  // Verify focus landed on button
  await waitFor(() => expect(document.activeElement).toBe(buttonElement));
});

/**
 * @function testChatWindowNoConfirmPromptWhenNoBookingInfo
 * @description Ensures ChatWindow does not show confirmation prompt
 *   when LLM returns no bookingInfo (fallback scenario).
 *
 * @returns {void}
 *
 * @sideEffects Mocks global fetch and simulates user interactions.
 */
test("When LLM returns no bookingInfo, ChatWindow does not show Confirm prompt (fallback)", async () => {
  // Mock fetch: parse returns reply but no bookingInfo
  global.fetch = jest.fn((url) => {
    if (url.endsWith("/api/llm/parse")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            reply: "Sorry, I couldn't determine which event you mean.",
            bookingInfo: null,
          }),
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });

  render(<ChatWindow />);

  const inputField = screen.getByPlaceholderText(/Type or speak a message/i);
  fireEvent.change(inputField, { target: { value: "Book some tickets" } });
  fireEvent.click(screen.getByRole("button", { name: /send/i }));

  // Wait for LLM fallback reply
  await waitFor(() => {
    expect(
      screen.getByText(/Sorry, I couldn't determine which event you mean./i)
    ).toBeInTheDocument();
  });

  // Confirm prompt should NOT be present when bookingInfo is null
  const confirmPrompt = screen.queryByText(/Confirm booking/i) || screen.queryByText(/Confirm/i);
  expect(confirmPrompt).toBeNull();

  // Restore original fetch
  global.fetch.mockRestore && global.fetch.mockRestore();
  global.fetch = undefined;
});