jest.setTimeout(10000);

// Mock the model before requiring the server so routes use the mocked functions
jest.mock("../models/adminModel", () => ({
  addEvent: jest.fn(),
  getAllEvents: jest.fn(),
}));

const adminModel = require("../models/adminModel");
const request = require("supertest");
// Require server after mocking models to avoid touching the real DB
const app = require("../server");

beforeEach(() => jest.resetAllMocks());

afterAll(async () => {
  if (app && typeof app.shutdown === "function") {
    await app.shutdown();
  }
});

describe("Admin Service routes", () => {
  test("POST /api/admin/events creates an event", async () => {
    const payload = { name: "Test Event", date: "2025-11-01", tickets: 10 };
    adminModel.addEvent.mockResolvedValue({ id: 123, ...payload });

    const res = await request(app).post("/api/admin/events").send(payload);

    expect([200, 201]).toContain(res.status);
    expect(adminModel.addEvent).toHaveBeenCalledWith(payload.name, payload.date, payload.tickets);
  });

  test("GET /api/admin/events returns events list", async () => {
    adminModel.getAllEvents.mockResolvedValue([{ id: 1, name: "Event A", tickets: 5 }]);

    const res = await request(app).get("/api/admin/events");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(adminModel.getAllEvents).toHaveBeenCalled();
  });
});