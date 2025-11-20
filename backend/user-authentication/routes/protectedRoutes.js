/**
 * Routes: protectedRoutes.js
 * ---------------------------------------------------------
 * Purpose:
 *   Defines routes that require authentication for access.
 *   Currently exposes a simple profile endpoint that returns
 *   the authenticated user's email address.
 *
 * Dependencies:
 *   - express.Router: For creating a modular route handler.
 *   - requireAuth middleware: Ensures requests carry a valid JWT.
 *
 * Routes:
 *   - GET /profile → Returns the authenticated user's basic profile data.
 *
 * Exports:
 *   - router: Configured Express router for protected routes.
 * ---------------------------------------------------------
 */

import { Router } from "express";
import requireAuth from "../middleware/requireAuth.js";

const router = Router();

/**
 * @function GET /profile
 * @description
 *   Protected endpoint that returns the authenticated user's
 *   basic profile information derived from req.user.
 *
 * @param {Object} req - Express request object (expects req.user).
 * @param {Object} res - Express response object.
 * @returns {JSON}
 *   - 200 OK: { email } for the authenticated user.
 */
router.get("/profile", requireAuth, (req, res) => {
  res.json({ email: req.user.email });
});

export default router;