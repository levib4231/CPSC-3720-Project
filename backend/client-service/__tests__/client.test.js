jest.setTimeout(10000);

const request = require("supertest");
const app = require("../server");

jest.mock("../models/clientModel");
const { getAllEvents, purchaseTicket } = require("../models/clientModel");

beforeEach(() => {
  jest.resetAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

afterAll(async () => {
  if (app && typeof app.shutdown === "function") {
    await app.shutdown();
  }
});

describe("Client Service routes", () => {
  test("GET /api/events returns events", async () => {
    getAllEvents.mockResolvedValue([{ id: 1, name: "Jazz Night", tickets: 5 }]);
    const res = await request(app).get("/api/events");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.any(Array));
    expect(getAllEvents).toHaveBeenCalled();
  });

  test("POST /api/events/:id/purchase calls model and returns success", async () => {
    purchaseTicket.mockResolvedValue({ success: true, remainingTickets: 4 });
    const res = await request(app).post("/api/events/1/purchase").send({ quantity: 1 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ success: true, remainingTickets: 4 }));
    expect(purchaseTicket).toHaveBeenCalledWith(1, 1);
  });

  test("POST /api/events/:id/purchase handles model error", async () => {
    purchaseTicket.mockRejectedValue(new Error("DB_WRITE_ERROR"));
    const res = await request(app).post("/api/events/1/purchase").send({ quantity: 1 });
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
  });
});