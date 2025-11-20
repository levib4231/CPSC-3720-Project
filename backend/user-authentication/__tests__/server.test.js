/**
 * Test Suite: serverHealth.test.js
 * ---------------------------------------------------------
 * Purpose:
 *   Verifies that the user-authentication server boots successfully
 *   and exposes a simple health-check style route.
 *
 * Dependencies:
 *   - supertest: For making HTTP requests against the Express app.
 *   - ../server.js: Express application under test.
 * ---------------------------------------------------------
 */

import request from "supertest";
import app from "../server.js";

describe("server boot", () => {
  /**
   * Ensures the server exposes a basic "health-ish" route
   * at /api/auth/me that responds with HTTP 200 (OK).
   *
   * @returns {Promise<void>} Resolves when the assertion completes.
   */
  it("exposes health-ish route", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(200);
  });
});