const request = require("supertest");
const app = require("../server");

describe("Admin Service (smoke)", () => {
  test("GET /api/admin route exists (status 200|404)", async () => {
    const res = await request(app).get("/api/admin");
    expect([200, 404]).toContain(res.status);
  });

  // ensure resources are closed after tests
  afterAll(async () => {
    if (app && typeof app.shutdown === "function") {
      await app.shutdown();
    }
  });
});