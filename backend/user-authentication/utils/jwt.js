/**
 * Utils: jwt.js
 * ---------------------------------------------------------
 * Purpose:
 *   Provides helper functions for signing and verifying JSON
 *   Web Tokens (JWT) used for authentication across services.
 *
 * Dependencies:
 *   - jsonwebtoken: Library for creating and validating JWTs.
 *
 * Environment Variables:
 *   - JWT_SECRET   : Secret key used to sign and verify tokens.
 *   - JWT_EXPIRES  : Optional string duration (e.g., "30m", "1h").
 *
 * Exports:
 *   - signToken(payload)
 *   - verifyToken(token)
 * ---------------------------------------------------------
 */

import jwt from "jsonwebtoken";

/**
 * @function signToken
 * @description
 *   Signs a JWT with the provided payload using the configured
 *   JWT secret and expiration time.
 *
 * @param {Object} payload
 *   Claims to embed in the token (e.g., { sub, email }).
 *
 * @returns {string}
 *   A signed JWT string.
 *
 * @throws {Error}
 *   If JWT_SECRET is missing or signing fails.
 */
export const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || "30m",
  });

/**
 * @function verifyToken
 * @description
 *   Verifies a JWT using the configured JWT secret and returns
 *   the decoded payload if valid.
 *
 * @param {string} token
 *   JWT string to verify.
 *
 * @returns {Object}
 *   Decoded token payload (e.g., { sub, email, iat, exp }).
 *
 * @throws {Error}
 *   If the token is expired, malformed, or invalid.
 */
export const verifyToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET);