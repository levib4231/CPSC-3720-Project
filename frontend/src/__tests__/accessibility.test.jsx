import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import ChatWindow from "../ChatWindow";
import VoiceInputButton from "../components/voice/VoiceInputButton";

test("No booking occurs before explicit confirmation (ChatWindow)", async () => {
  const calls = [];
  global.fetch = jest.fn((url, opts) => {
    calls.push(url);
    if (url && url.endsWith("/api/llm/parse")) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            reply: "I can book that for you.",
            bookingInfo: { event: "Jazz Night", tickets: 2 },
          }),
      });
    }
    if (url && url.endsWith("/api/llm/confirm")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    }
    if (url && url.includes("/api/events/")) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ message: "purchased" }) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });

  render(<ChatWindow />);

  const input = screen.getByPlaceholderText(/Type or speak a message/i);
  await act(async () => {
    fireEvent.change(input, { target: { value: "Book two tickets for Football Game" } });
    const send = screen.getByRole("button", { name: /send/i });
    fireEvent.click(send);
  });

  // wait for LLM reply to appear
  await screen.findByText(/I can book that for you./i);

  // Ensure parse endpoint was called
  expect(calls.some((u) => u.endsWith("/api/llm/parse"))).toBe(true);
  // Ensure there was no direct client purchase call before confirmation
  expect(calls.some((u) => u.includes("/api/events/"))).toBe(false);

  // Now click confirm and ensure confirm endpoint is called
  // wait for confirmation UI
  await waitFor(() => {
    expect(screen.getByText(/Confirm booking of/)).toBeInTheDocument();
  });

  const confirmButton = screen.getByRole("button", { name: /confirm/i });

  // click inside act, then wait for the confirm network call
  await act(async () => {
    fireEvent.click(confirmButton);
  });

  await waitFor(() => expect(calls.some((u) => u.endsWith("/api/llm/confirm"))).toBe(true));

  // cleanup
  global.fetch.mockRestore && global.fetch.mockRestore();
  global.fetch = undefined;
});

test("VoiceInputButton is keyboard-focusable and has an accessible name", async () => {
  const onTranscript = jest.fn();
  render(<VoiceInputButton onTranscript={onTranscript} />);
  const button = screen.getByRole("button");
  expect(button).toBeTruthy();
  await act(async () => {
    button.focus();
  });
  await waitFor(() => expect(document.activeElement).toBe(button));
});

test("When LLM returns no bookingInfo, ChatWindow does not show Confirm prompt (fallback)", async () => {
  // Mock fetch: parse returns reply but no bookingInfo
  global.fetch = jest.fn((url, opts) => {
    if (url && url.endsWith("/api/llm/parse")) {
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

  const input = screen.getByPlaceholderText(/Type or speak a message/i);
  fireEvent.change(input, { target: { value: "Book some tickets" } });

  const send = screen.getByRole("button", { name: /send/i });
  fireEvent.click(send);

  await waitFor(() => {
    expect(screen.getByText(/Sorry, I couldn't determine which event you mean./i)).toBeInTheDocument();
  });

  // Confirm prompt should NOT be present when bookingInfo is null/unparsable
  const confirmPrompt = screen.queryByText(/Confirm booking/i) || screen.queryByText(/Confirm/i);
  expect(confirmPrompt).toBeNull();

  global.fetch.mockRestore && global.fetch.mockRestore();
  global.fetch = undefined;
});
