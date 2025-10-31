/**
 * Test Suite: ChatWindow LLM Integration
 * ---------------------------------------------------------
 * Purpose:
 *   Tests ChatWindow component interactions with the LLM parse endpoint,
 *   ensuring that user messages trigger LLM calls and display appropriate
 *   booking confirmation prompts when bookingInfo is returned.
 *
 * Dependencies:
 *   - @testing-library/react
 *   - ChatWindow component
 * ---------------------------------------------------------
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChatWindow from "../ChatWindow";

/**
 * @function setupGlobalFetchMock
 * @description Mocks the global fetch API to simulate LLM parse endpoint responses.
 *   Returns bookingInfo for parse calls, and empty responses for other calls.
 *
 * @returns {void}
 */
beforeEach(() => {
  global.fetch = jest.fn((url) => {
    if (url.endsWith("/api/llm/parse")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            reply: "I can prepare that booking for you.",
            bookingInfo: { event: "Jazz Night", tickets: 2 },
          }),
      });
    }

    // Fallback for other endpoints
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  });
});

/**
 * @function cleanupMocks
 * @description Resets all Jest mocks after each test to avoid test interference.
 *
 * @returns {void}
 */
afterEach(() => jest.resetAllMocks());

/**
 * @function testChatWindowShowsBookingPrompt
 * @description Tests that ChatWindow sends the user's message to the LLM parse endpoint
 *   and displays both the LLM reply and the booking confirmation prompt if bookingInfo is returned.
 *
 * @returns {void}
 *
 * @sideEffects Mocks global fetch and interacts with rendered ChatWindow.
 */
test("sends message to LLM parse and shows booking prompt", async () => {
  render(<ChatWindow />);

  // Locate input field, supporting both placeholder and role
  const messageInput =
    screen.getByPlaceholderText(/type or speak/i) || screen.getByRole("textbox");

  // Simulate user typing a booking request
  fireEvent.change(messageInput, { target: { value: "Book two tickets for Jazz Night" } });

  // Locate and click the Send button
  const sendButton =
    screen.getByRole("button", { name: /send/i }) || screen.getByText(/send/i);
  fireEvent.click(sendButton);

  // Wait for LLM reply and booking confirmation prompt to render
  await waitFor(() => {
    // Verify LLM reply is shown in UI
    expect(screen.getByText(/I can prepare that booking for you./i)).toBeInTheDocument();

    // Verify booking confirmation prompt is displayed
    expect(screen.getByText(/Confirm booking/i)).toBeInTheDocument();
  });
});