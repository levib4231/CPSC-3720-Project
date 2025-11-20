/**
 * Server: user-authentication/index.js
 * ---------------------------------------------------------
 * Purpose:
 *   Bootstraps the user-authentication service by:
 *     - Loading environment variables (shared + service-specific).
 *     - Applying local development fallbacks.
 *     - Initializing the Express application with middleware.
 *     - Registering authentication and protected API routes.
 *     - Starting the HTTP server.
 *
 * Dependencies:
 *   - dotenv: Loads environment variables from .env files.
 *   - path, url: Resolve file system paths in ES module context.
 *   - express: HTTP server framework.
 *   - cors: Cross-Origin Resource Sharing configuration.
 *   - cookie-parser: Parses cookies in incoming HTTP requests.
 *   - ./db.js: Establishes MongoDB connection.
 *   - ./routes/authRoutes.js: Auth-related routes (register, login, logout, etc.).
 *   - ./routes/protectedRoutes.js: Routes requiring valid authentication.
 *
 * Environment Variables:
 *   - JWT_SECRET        (from project root .env, shared across services)
 *   - MONGO_URI         (from service .env or local fallback)
 *   - PORT              (from service .env or local fallback)
 *   - CLIENT_ORIGIN     (from service .env or local fallback)
 *
 * Exports:
 *   - app: Express application instance (for testing).
 * ---------------------------------------------------------
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load shared secrets (e.g., JWT_SECRET) from the project root `.env`.
 *
 * This file is intended for configuration values shared across multiple
 * backend services, such as JWT-related settings.
 */
dotenv.config({
  path: path.join(__dirname, "..", "..", ".env"),
});

/**
 * Load service-specific configuration from this service's `.env`.
 *
 * Typical values:
 *   - MONGO_URI
 *   - PORT
 *   - CLIENT_ORIGIN
 *
 * These can override values loaded from the shared root `.env` if the keys
 * overlap, which allows service-level customization.
 */
dotenv.config();

/**
 * Apply fallback defaults for local development when certain environment
 * variables are missing. These mirror the values documented in `.env.example`
 * so that the service behaves predictably without a fully configured .env.
 */

// Fallback MongoDB URI for local development if none is provided.
if (!process.env.MONGO_URI) {
  process.env.MONGO_URI = "mongodb://127.0.0.1:27017/user_auth_demo";
}

// Default HTTP port for this service (string to match typical env usage).
process.env.PORT = process.env.PORT || "6003";

// Default frontend origin for CORS when not explicitly configured.
if (!process.env.CLIENT_ORIGIN) {
  process.env.CLIENT_ORIGIN = "http://localhost:3000";
}

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import "./db.js";
import authRoutes from "./routes/authRoutes.js";
import protectedRoutes from "./routes/protectedRoutes.js";

/**
 * @constant app
 * @description
 *   Express application instance for the user-authentication service.
 *
 *   Responsibilities:
 *     - Configure global middleware (CORS, JSON parsing, cookies).
 *     - Mount API route handlers for authentication and protected routes.
 */
const app = express();

/**
 * Configure Cross-Origin Resource Sharing (CORS) to allow the frontend
 * application to send requests with credentials (e.g., cookies).
 *
 * @property {string} origin
 *   Allowed origin for cross-site requests, typically the frontend URL.
 * @property {boolean} credentials
 *   Indicates that cookies and authorization headers are allowed.
 */
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
  }),
);

// Parse incoming JSON request bodies and attach them to req.body.
app.use(express.json());

// Parse cookies from incoming requests and attach them to req.cookies.
app.use(cookieParser());

/**
 * Route registration
 * ---------------------------------------------------------
 * /api/auth      - Public authentication endpoints (login, signup, logout, etc.).
 * /api/protected - Endpoints that require a valid authenticated user.
 */
app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);

/**
 * Determine the port on which the HTTP server will listen.
 * Priority:
 *   1) process.env.PORT (from env or fallback above)
 *   2) 6003 (hardcoded numeric default)
 */
const port = process.env.PORT || 6003;

/**
 * Start the Express HTTP server.
 *
 * @sideEffects
 *   - Binds the server to the specified port.
 *   - Logs the listening URL to the console for developer visibility.
 */
app.listen(port, () => {
  // Using a clear tag to identify which service is running on this port.
  console.log(`user-authentication on http://localhost:${port}`);
});

export default app; // for tests