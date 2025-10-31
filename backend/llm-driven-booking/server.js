/**
 * @file server.js
 * ---------------------------------------------------------
 * @description
 *   Entry point for the LLM Service, which interprets natural-language
 *   booking requests and confirms event bookings through other microservices.
 *   Configures middleware, mounts routes, and provides lifecycle helpers
 *   for clean startup and shutdown (test-friendly design).
 *
 * Dependencies:
 *   - express: Web framework for defining HTTP endpoints.
 *   - cors: Enables cross-origin resource sharing.
 *   - dotenv: Loads environment variables from .env file.
 *   - llmRoutes.js: Route definitions for LLM parsing and booking confirmation.
 *
 * Exports:
 *   - Express app instance (used in tests or when imported by other modules).
 *   - When executed directly, starts the HTTP server on PORT.
 * ---------------------------------------------------------
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const llmRoutes = require("./routes/llmRoutes");

const app = express();

// --- Middleware setup ---
app.use(cors());
app.use(express.json());

// --- Route mounting ---
app.use("/api/llm", llmRoutes);

const PORT = process.env.PORT || 6002;

/**
 * @description Starts the LLM Service if this file is executed directly.
 * When imported by test files, server startup is skipped for test control.
 */
if (require.main === module) {
  app.__serverInstance = app.listen(PORT, () =>
    console.log(`[LLM Service] Running on port ${PORT}`)
  );
}

/**
 * @function app.shutdown
 * @description Gracefully shuts down the service (used for integration tests).
 * If future resources (e.g., DB connections, background workers) are opened,
 * close them here.
 *
 * @returns {Promise<void>} Resolves when all server resources are closed.
 */
app.shutdown = async function () {
  if (app.__serverInstance && typeof app.__serverInstance.close === "function") {
    await new Promise((res) => app.__serverInstance.close(res));
  }
};

module.exports = app;