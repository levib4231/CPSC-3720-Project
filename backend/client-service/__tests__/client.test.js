/**
 * @file clientRoutes.test.js
 * ---------------------------------------------------------
 * @description
 *   Integration tests for the Client Service API routes.
 *   Verifies that:
 *     - GET /api/events correctly returns event listings.
 *     - POST /api/events/:id/purchase triggers purchase logic.
 *     - Errors from the model layer are handled gracefully.
 *
 * Dependencies:
 *   - supertest: Simulates HTTP requests to the Express app.
 *   - jest: Provides mocking and lifecycle hooks.
 *   - clientModel (mocked): Supplies stubbed database operations.
 *
 * Test Environment:
 *   Uses Node.js (set in jest.config.js).
 * ---------------------------------------------------------
 */

jest.setTimeout(10000);

const request = require("supertest");
const app = require("../server");

// --- Mock the model layer to avoid DB/network calls ---
jest.mock("../models/clientModel");
const { getAllEvents, purchaseTicket } = require("../models/clientModel");

// --- Lifecycle hooks ---
beforeEach(() => {
  jest.resetAllMocks(); // Ensure mocks are clean between tests
});

afterEach(() => {
  jest.restoreAllMocks(); // Restore original methods after each test
});

afterAll(async () => {
  // Graceful shutdown (if Express supports it)
  if (app && typeof app.shutdown === "function") {
    await app.shutdown();
  }
});

/**
 * @test
 * @description
 *   Verifies that GET /api/events returns an array of events
 *   and that the model’s `getAllEvents` function is invoked.
 */
describe("Client Service routes", () => {
  test("GET /api/events returns events", async () => {
    // --- Arrange ---
    getAllEvents.mockResolvedValue([{ id: 1, name: "Jazz Night", tickets: 5 }]);

    // --- Act ---
    const res = await request(app).get("/api/events");

    // --- Assert ---
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.any(Array));
    expect(getAllEvents).toHaveBeenCalled();
  });

  /**
   * @test
   * @description
   *   Ensures POST /api/events/:id/purchase successfully
   *   calls the `purchaseTicket` model function and returns
   *   the correct JSON response.
   */
  test("POST /api/events/:id/purchase calls model and returns success", async () => {
    // --- Arrange ---
    purchaseTicket.mockResolvedValue({ success: true, remainingTickets: 4 });

    // --- Act ---
    const res = await request(app)
      .post("/api/events/1/purchase")
      .send({ quantity: 1 });

    // --- Assert ---
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({ success: true, remainingTickets: 4 })
    );
    expect(purchaseTicket).toHaveBeenCalledWith(1, 1);
  });

  /**
   * @test
   * @description
   *   Confirms that the service correctly handles model errors
   *   (e.g., database failure) and returns HTTP 500.
   */
  test("POST /api/events/:id/purchase handles model error", async () => {
    // --- Arrange ---
    purchaseTicket.mockRejectedValue(new Error("DB_WRITE_ERROR"));

    // --- Act ---
    const res = await request(app)
      .post("/api/events/1/purchase")
      .send({ quantity: 1 });

    // --- Assert ---
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
  });
});