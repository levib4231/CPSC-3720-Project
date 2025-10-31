/**
 * @file llmController.test.js
 * ---------------------------------------------------------
 * @description
 *   Integration-style Jest tests for the LLM Controller's endpoints.
 *   Focuses on verifying that `/api/llm/confirm` correctly interacts with
 *   mocked dependencies (axios and llmParser) to confirm bookings.
 *
 * Dependencies:
 *   - supertest: For simulating HTTP requests to the Express app.
 *   - jest.mock: Used to isolate external dependencies (axios, llmParser).
 *
 * Notes:
 *   - All outbound HTTP requests are mocked to avoid network calls.
 *   - The Express app exports a shutdown helper to close resources cleanly.
 * ---------------------------------------------------------
 */

jest.setTimeout(10000);

const request = require("supertest");
const app = require("../server");

// --- Mock external dependencies ---
jest.mock("axios");
const axios = require("axios");

// Mock the internal LLM parser service
jest.mock("../services/llmParser");
const { parseTextToBooking } = require("../services/llmParser");

// --- Test Lifecycle Hooks ---
beforeEach(() => {
  jest.resetAllMocks(); // Clean mocks before each test
});

afterAll(async () => {
  // Gracefully close Express server (if started)
  if (app && typeof app.shutdown === "function") {
    await app.shutdown();
  }
});

/**
 * @test
 * @description
 *   Ensures the /api/llm/confirm route interacts with the mocked Event Service
 *   and returns a success response when tickets are available.
 *
 * @steps
 *   1. Mock `parseTextToBooking` to simulate parsed booking data.
 *   2. Mock axios.get to return event info (simulating Event Service).
 *   3. Mock axios.post to simulate successful ticket purchase calls.
 *   4. Send POST request to /api/llm/confirm with booking payload.
 *   5. Validate response status and axios call behavior.
 */
test("POST /api/llm/confirm calls event service and returns success", async () => {
  // --- Arrange ---
  parseTextToBooking.mockResolvedValue({
    event: "Jazz Night",
    tickets: 2,
    intent: "book",
  });

  // Mock event listing and successful purchase
  axios.get.mockResolvedValue({
    data: [{ id: 1, name: "Jazz Night", tickets: 10 }],
  });
  axios.post.mockResolvedValue({ status: 200, data: { success: true } });

  // --- Act ---
  const res = await request(app)
    .post("/api/llm/confirm")
    .send({ eventName: "Jazz Night", tickets: 2 });

  // --- Assert ---
  expect(res.status).toBe(200);
  expect(axios.get).toHaveBeenCalledWith("http://localhost:6001/api/events");
  expect(axios.post).toHaveBeenCalledTimes(2); // 2 tickets purchased
  expect(res.body).toHaveProperty("success", true);
});