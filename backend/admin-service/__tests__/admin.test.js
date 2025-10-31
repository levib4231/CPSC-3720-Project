/**
 * @file adminRoutes.test.js
 * ---------------------------------------------------------
 * @description
 *   Unit tests for the Admin Service routes using Jest and
 *   Supertest. All database interactions are mocked via
 *   `adminModel` to ensure isolated API testing.
 *
 *   Tests include:
 *     - POST /api/admin/events : Event creation
 *     - GET /api/admin/events  : Event listing
 * ---------------------------------------------------------
 */

jest.setTimeout(10000);

// Mock the adminModel before requiring the server to prevent real DB access
jest.mock("../models/adminModel", () => ({
  addEvent: jest.fn(),
  getAllEvents: jest.fn(),
}));

const adminModel = require("../models/adminModel");
const request = require("supertest");
const app = require("../server");

beforeEach(() => jest.resetAllMocks());

afterAll(async () => {
  if (app && typeof app.shutdown === "function") {
    await app.shutdown();
  }
});

describe("Admin Service routes", () => {
  /**
   * @test
   * @description Ensures event creation via POST /api/admin/events.
   * Expects status 200/201 and verifies that the model method is called correctly.
   */
  test("POST /api/admin/events creates an event", async () => {
    const payload = { name: "Test Event", date: "2025-11-01", tickets: 10 };
    adminModel.addEvent.mockResolvedValue({ id: 123, ...payload });

    const res = await request(app).post("/api/admin/events").send(payload);

    expect([200, 201]).toContain(res.status);
    expect(adminModel.addEvent).toHaveBeenCalledWith(
      payload.name,
      payload.date,
      payload.tickets
    );
  });

  /**
   * @test
   * @description Ensures retrieval of events via GET /api/admin/events.
   * Expects status 200 and validates array response.
   */
  test("GET /api/admin/events returns events list", async () => {
    adminModel.getAllEvents.mockResolvedValue([{ id: 1, name: "Event A", tickets: 5 }]);

    const res = await request(app).get("/api/admin/events");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(adminModel.getAllEvents).toHaveBeenCalled();
  });
});