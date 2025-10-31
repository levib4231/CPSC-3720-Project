/**
 * @file llmParse.test.js
 * ---------------------------------------------------------
 * @description
 *   Tests the `/api/llm/parse` endpoint of the LLM Service.
 *   Verifies that:
 *     - The route is reachable.
 *     - The endpoint correctly calls the mocked LLM (axios.post).
 *     - No external network calls are made during tests.
 *
 * Dependencies:
 *   - supertest: To simulate HTTP requests to the Express app.
 *   - jest: For test orchestration and mocking.
 *   - axios: Mocked to simulate LLM and client service responses.
 *
 * Notes:
 *   - Uses a generous timeout to accommodate any async I/O.
 *   - This test does not validate semantic correctness of LLM output,
 *     only that the request pipeline executes successfully.
 * ---------------------------------------------------------
 */

jest.setTimeout(10000);

const request = require("supertest");
const app = require("../server");

// --- Mock axios globally to prevent real network calls ---
jest.mock("axios");
const axios = require("axios");

beforeAll(() => {
  // Mock POST requests (LLM chat/completion responses)
  axios.post.mockResolvedValue({
    data: {
      choices: [
        {
          message: {
            content:
              "I can prepare that booking for you: Jazz Night, 2 tickets.",
          },
        },
      ],
    },
  });

  // Mock GET requests (e.g., event list fetch from client service)
  axios.get.mockResolvedValue({
    data: [{ id: 1, name: "Jazz Night", tickets: 10 }],
  });
});

afterAll(async () => {
  // Ensure Express shuts down cleanly
  if (app && typeof app.shutdown === "function") {
    await app.shutdown();
  }
});

/**
 * @test
 * @description
 *   Ensures `/api/llm/parse` returns a response when a booking request is sent,
 *   and verifies that axios mocks were triggered instead of real HTTP calls.
 *
 * @steps
 *   1. Send POST request with a natural language booking message.
 *   2. Validate that the route responds (status 200/400/404 acceptable).
 *   3. Confirm axios.post was called (ensures LLM call path executed).
 */
describe("LLM Service (mocked network)", () => {
  test("POST /api/llm/parse returns response and uses mocked axios", async () => {
    // --- Act ---
    const res = await request(app)
      .post("/api/llm/parse")
      .send({ message: "Book two tickets for Jazz Night" });

    // --- Assert ---
    expect([200, 400, 404]).toContain(res.status);
    expect(axios.post).toHaveBeenCalled();
  });
});