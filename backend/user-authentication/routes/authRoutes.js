/**
 * Routes: authRoutes.js
 * ---------------------------------------------------------
 * Purpose:
 *   Defines authentication-related API endpoints for the
 *   user-authentication service.
 *
 * Dependencies:
 *   - express.Router: For creating a modular route handler.
 *   - authController: Handler functions for auth operations.
 *
 * Routes:
 *   - POST /register  → register
 *   - POST /login     → login
 *   - GET  /me        → me (lightweight auth presence check)
 *   - POST /logout    → logout
 *
 * Exports:
 *   - router: Configured Express router for auth routes.
 * ---------------------------------------------------------
 */

import { Router } from "express";
import { register, login, me, logout } from "../controllers/authController.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", me);
router.post("/logout", logout);

export default router;