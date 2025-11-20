/**
 * Test Suite: authFlow.test.js
 * ---------------------------------------------------------
 * Purpose:
 *   End-to-end integration tests for the user authentication flow.
 *   Verifies that a user can:
 *     1) Register with valid credentials.
 *     2) Log in with those credentials.
 *     3) Access a protected route using the issued auth cookie.
 *
 * Dependencies:
 *   - supertest: For making HTTP requests against the Express app.
 *   - ../server.js: Express application under test.
 *   - mongoose: For managing the MongoDB connection lifecycle.
 *   - ../models/User.js: User model for test data setup/cleanup.
 * ---------------------------------------------------------
 */

import request from "supertest";
import app from "../server.js";
import mongoose from "mongoose";
import User from "../models/User.js";

describe("auth flow", () => {
  const email = "test@example.com";
  const password = "Passw0rd!";

  beforeAll(async () => {
    await User.deleteMany({ email });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  /**
   * Integration test: register → login → access protected route
   *
   * Flow:
   *   1) POST /api/auth/register with { email, password }.
   *   2) POST /api/auth/login with the same credentials and capture
   *      the auth cookie from the response.
   *   3) GET /api/protected/profile with that cookie attached.
   *
   * Expectations:
   *   - Registration responds with HTTP 201 (Created).
   *   - Login responds with HTTP 200 (OK) and sets a cookie.
   *   - Protected profile responds with HTTP 200 (OK) and
   *     returns a body containing the same email.
   */
  it("register → login → access protected", async () => {
    const reg = await request(app)
      .post("/api/auth/register")
      .send({ email, password });
    expect(reg.status).toBe(201);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email, password });
    expect(login.status).toBe(200);

    const cookie = login.headers["set-cookie"][0];

    const prof = await request(app)
      .get("/api/protected/profile")
      .set("Cookie", cookie);

    expect(prof.status).toBe(200);
    expect(prof.body.email).toBe(email);
  });
});