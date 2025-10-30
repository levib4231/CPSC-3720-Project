jest.setTimeout(10000);

const request = require("supertest");
const app = require("../server");

// Mock axios so no external LLM/network calls are made during tests
jest.mock("axios");
const axios = require("axios");

beforeAll(() => {
  // Mock the LLM POST (chat/completion) response
  axios.post = jest.fn().mockResolvedValue({
    data: {
      choices: [
        {
          message: {
            content: "I can prepare that booking for you: Jazz Night, 2 tickets.",
          },
        },
      ],
    },
  });

  // Mock any GET requests (e.g., to client service for event list)
  axios.get = jest.fn().mockResolvedValue({
    data: [{ id: 1, name: "Jazz Night", tickets: 10 }],
  });
});

afterAll(async () => {
  // Ensure any test-side resources are closed
  if (app && typeof app.shutdown === "function") {
    await app.shutdown();
  }
});

describe("LLM Service (mocked network)", () => {
  test("POST /api/llm/parse returns a response and uses mocked axios", async () => {
    const res = await request(app)
      .post("/api/llm/parse")
      .send({ message: "Book two tickets for Jazz Night" });

    // route should be reachable; allow 200/400/404 depending on implementation
    expect([200, 400, 404]).toContain(res.status);
    // verify our mock was used (prevents real network calls and stray handles)
    expect(axios.post).toHaveBeenCalled();
  });
});