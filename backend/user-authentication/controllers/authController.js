/**
 * Controller: authController.js
 * ---------------------------------------------------------
 * Purpose:
 *   Handles user authentication-related HTTP requests, including:
 *     - User registration
 *     - Login (cookie-based or token-in-response)
 *     - Lightweight auth presence check
 *     - Logout
 *
 * Dependencies:
 *   - User model for persistence (MongoDB via Mongoose)
 *   - bcryptjs for password hashing and comparison
 *   - signToken utility for issuing JWTs
 *
 * Exports:
 *   - register(req, res)
 *   - login(req, res)
 *   - me(req, res)
 *   - logout(req, res)
 * ---------------------------------------------------------
 */

import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signToken } from "../utils/jwt.js";

const cookieCfg = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.COOKIE_SECURE === "true",
  maxAge: 30 * 60 * 1000, // 30 minutes
};

/**
 * @function register
 * @description
 *   Registers a new user with an email and password. The password
 *   is hashed before storage. On success, returns the new user's id
 *   and email.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Request body containing credentials.
 * @param {string} req.body.email - User email (must be unique).
 * @param {string} req.body.password - Plain-text password.
 *
 * @param {Object} res - Express response object.
 * @returns {JSON}
 *   - 201 Created: { id, email } on success.
 *   - 400 Bad Request: { message } if email or password missing.
 *   - 409 Conflict: { message } if email is already in use.
 *
 * @sideEffects
 *   - Writes a new user record to the database on success.
 */
export async function register(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password required" });
  }

  const exists = await User.findOne({ email });
  if (exists) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, passwordHash });
  return res.status(201).json({ id: user._id, email: user.email });
}

/**
 * @function login
 * @description
 *   Authenticates a user with email and password. On success, issues
 *   a JWT either:
 *     - As an HTTP-only cookie (default "cookie" mode), or
 *     - In the JSON response body ("memory" mode) so the client can
 *       attach it manually when calling other services.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.body - Request body with login data.
 * @param {string} req.body.email - User email.
 * @param {string} req.body.password - Plain-text password.
 * @param {string} [req.body.delivery="cookie"]
 *   Delivery mode for the token: "cookie" | "memory".
 *
 * @param {Object} res - Express response object.
 * @returns {JSON}
 *   - 200 OK:
 *       - cookie mode: { email }
 *       - memory mode: { token, email, expiresIn }
 *   - 401 Unauthorized: { message } if credentials are invalid.
 *
 * @sideEffects
 *   - In "cookie" mode, sets an HTTP-only "token" cookie on the response.
 */
export async function login(req, res) {
  const { email, password, delivery = "cookie" } = req.body || {};
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken({ sub: String(user._id), email: user.email });

  if (delivery === "memory") {
    return res.json({
      token,
      email: user.email,
      expiresIn: 30 * 60,
    });
  }

  res.set("Cache-Control", "no-store");
  res.cookie("token", token, cookieCfg);
  return res.json({ email: user.email });
}

/**
 * @function me
 * @description
 *   Performs a lightweight presence check based on the existence
 *   of a "token" cookie. Does not fully validate the JWT payload;
 *   use protected endpoints for stricter verification.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.cookies - Parsed cookies.
 *
 * @param {Object} res - Express response object.
 * @returns {JSON}
 *   - 200 OK: { authenticated: boolean }
 *     true if a "token" cookie is present, false otherwise.
 */
export function me(req, res) {
  return res.json({ authenticated: Boolean(req.cookies?.token) });
}

/**
 * @function logout
 * @description
 *   Logs out the current user by clearing the "token" cookie.
 *
 * @param {Object} _req - Express request object (unused).
 * @param {Object} res - Express response object.
 * @returns {JSON}
 *   - 200 OK: { message: "Logged out" } after clearing the cookie.
 *
 * @sideEffects
 *   - Clears the "token" cookie in the user's browser.
 */
export function logout(_req, res) {
  res.clearCookie("token", cookieCfg);
  return res.json({ message: "Logged out" });
}