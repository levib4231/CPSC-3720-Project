/**
 * Server: server.js
 * ---------------------------------------------------------
 * Purpose:
 *   Initializes the TigerTix Express server.
 *   Sets up middleware, CORS, and mounts API routes.
 *
 * Standards Addressed:
 *   - Function and file-level documentation
 *   - Clear modular separation of routes
 *   - Consistent formatting and naming
 * ---------------------------------------------------------
 */

const express = require("express");
const cors = require("cors");
const routes = require("./routes/routes");

const app = express();

// ---------------------------------------------------------
// Middleware
// ---------------------------------------------------------
app.use(cors());
app.use(express.json()); // Parse JSON bodies

// ---------------------------------------------------------
// Routes
// ---------------------------------------------------------
/**
 * @route   /api/*
 * @desc    Mounts all API routes under /api namespace
 */
app.use("/api", routes);

// ---------------------------------------------------------
// Server Initialization
// ---------------------------------------------------------
const PORT = 5001;

/**
 * Starts the Express server.
 * Logs the listening URL to the console.
 */
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// ---------------------------------------------------------
// Export app (optional for testing)
// ---------------------------------------------------------
module.exports = app;