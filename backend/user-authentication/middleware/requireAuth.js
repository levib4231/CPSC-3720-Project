/**
 * Middleware: requireAuth.js
 * ---------------------------------------------------------
 * Purpose:
 *   Ensures that incoming HTTP requests are authenticated before
 *   allowing access to protected routes. Supports JWT retrieval from
 *   either:
 *     - HTTP-only "token" cookie, or
 *     - Authorization header with "Bearer <token>" format.
 *
 * Dependencies:
 *   - verifyToken: Utility function for verifying and decoding JWTs.
 *
 * Exports:
 *   - requireAuth(req, res, next): Express middleware.
 * ---------------------------------------------------------
 */

import { verifyToken } from "../utils/jwt.js";

/**
 * @function requireAuth
 * @description
 *   Express middleware that enforces authentication by checking for a
 *   valid JWT. The token is read from either the "Authorization" header
 *   (Bearer scheme) or from the "token" cookie. If verification succeeds,
 *   the decoded payload is attached to `req.user` and the request is
 *   passed to the next middleware. Otherwise, a 401 Unauthorized response
 *   is returned.
 *
 * @param {Object} req - Express request object.
 * @param {Object} req.headers - Request headers.
 * @param {string} [req.headers.authorization] - Optional Bearer token header.
 * @param {Object} [req.cookies] - Parsed cookies on the request.
 *
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 *
 * @returns {void}
 *   - Calls next() on success.
 *   - Sends a 401 JSON response on failure.
 *
 * @sideEffects
 *   - Attaches the decoded JWT payload to req.user on successful auth.
 */
export default function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : null;
  const token = req.cookies?.token || bearer;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ message: "Token expired or invalid" });
  }
}