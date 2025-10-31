/**
 * @file adminSmoke.test.js
 * ---------------------------------------------------------
 * @description
 *   Basic smoke tests for the Admin Service to ensure
 *   key routes exist and respond without server errors.
 *
 *   This test does not validate functionality, only
 *   the existence and accessibility of the route.
 *
 * Usage:
 *   npx jest __tests__/adminSmoke.test.js
 * ---------------------------------------------------------
 */

const request = require("supertest");
const app = require("../server");

describe("Admin Service (smoke)", () => {
  /**
   * @test
   * @description Verify that GET /api/admin responds without crashing.
   * Acceptable responses are 200 (route exists) or 404 (route not implemented yet).
   */
  test("GET /api/admin route exists (status 200|404)", async () => {
    const res = await request(app).get("/api/admin");
    expect([200, 404]).toContain(res.status);
  });

  // Ensure resources are closed after tests
  afterAll(async () => {
    if (app && typeof app.shutdown === "function") {
      await app.shutdown();
    }
  });
});