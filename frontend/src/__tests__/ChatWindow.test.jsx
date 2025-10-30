import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChatWindow from "../ChatWindow";

// mock global fetch for LLM endpoints
beforeEach(() => {
  global.fetch = jest.fn((url, opts) => {
    if (url.endsWith("/api/llm/parse")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          reply: "I can prepare that booking for you.",
          bookingInfo: { event: "Jazz Night", tickets: 2 }
        })
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  });
});

afterEach(() => jest.resetAllMocks());

test("sends message to LLM parse and shows booking prompt", async () => {
  render(<ChatWindow />);
  const input = screen.getByPlaceholderText(/type or speak/i) || screen.getByRole("textbox");
  fireEvent.change(input, { target: { value: "Book two tickets for Jazz Night" } });
  const send = screen.getByRole("button", { name: /send/i }) || screen.getByText(/send/i);
  fireEvent.click(send);

  await waitFor(() => {
    expect(screen.getByText(/I can prepare that booking for you./i)).toBeInTheDocument();
    expect(screen.getByText(/Confirm booking/i)).toBeInTheDocument();
  });
});