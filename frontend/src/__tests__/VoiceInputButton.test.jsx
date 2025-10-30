import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import VoiceInputButton from "../components/voice/VoiceInputButton";

jest.setTimeout(15000);

test("records and shows transcript then invokes callback", async () => {
  jest.useFakeTimers();
  const onTranscript = jest.fn();

  render(<VoiceInputButton onTranscript={onTranscript} />);

  const btn = screen.getByRole("button", { name: /voice|start/i });

  await act(async () => {
    fireEvent.click(btn);
    // advance timers so MockRecognition fires its setTimeout
    jest.advanceTimersByTime(100);
  });

  await waitFor(() => {
    expect(onTranscript).toHaveBeenCalled();
    expect(onTranscript.mock.calls[0][0]).toMatch(/Jazz Night/);
  });

  jest.useRealTimers();
});