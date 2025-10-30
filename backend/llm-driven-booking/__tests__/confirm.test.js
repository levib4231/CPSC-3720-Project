jest.setTimeout(10000);

const request = require("supertest");
const app = require("../server");

// mock axios to prevent external HTTP calls from tests
jest.mock("axios");
const axios = require("axios");

// If LLM controller uses an internal parser, mock it
jest.mock("../services/llmParser");
const { parseTextToBooking } = require("../services/llmParser");

beforeEach(() => {
  jest.resetAllMocks();
});

afterAll(async () => {
  if (app && typeof app.shutdown === "function") {
    await app.shutdown();
  }
});

test("POST /api/llm/confirm calls client service and returns success", async () => {
  // Mock parser and event lookup
  parseTextToBooking.mockResolvedValue({ event: "Jazz Night", tickets: 2, intent: "book" });

  // Mock client-service purchase API call
  axios.post.mockResolvedValue({ status: 200, data: { success: true } });
  axios.get.mockResolvedValue({ data: [{ id: 1, name: "Jazz Night", tickets: 10 }] });

  const res = await request(app).post("/api/llm/confirm").send({ eventName: "Jazz Night", tickets: 2 });

  expect([200, 201, 200]).toContain(res.status);
  expect(axios.post).toHaveBeenCalled();
  // depending on your route you may return success shape; validate at least status
});