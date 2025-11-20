/**
 * Config: testEnvSetup.js
 * ---------------------------------------------------------
 * Purpose:
 *   Loads environment variables required for tests, combining:
 *     - Shared project-level secrets (e.g., JWT_SECRET)
 *     - Service-specific configuration (e.g., MONGO_URI, PORT)
 *
 * Behavior:
 *   - Resolves the current file path using ES module utilities.
 *   - Loads a shared `.env` file from the project root.
 *   - Loads a service-local `.env` from the current working directory.
 *
 * Dependencies:
 *   - dotenv: For loading environment variables from .env files.
 *   - path: For constructing platform-safe file system paths.
 *   - url: For converting ES module URLs to file paths.
 *
 * Side Effects:
 *   - Mutates process.env by populating it with values from:
 *       1) ../../.env (shared secrets)
 *       2) ./.env (service-specific configuration)
 * ---------------------------------------------------------
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Resolve the absolute path of this module in an ES module context.
 * In CommonJS, __filename is provided automatically, but in ES modules
 * it must be derived from import.meta.url.
 */
const __filename = fileURLToPath(import.meta.url);

/**
 * Directory name of the current module file.
 * Used as a starting point to locate the shared project-level .env file.
 */
const __dirname = path.dirname(__filename);

/**
 * Load shared environment variables from the project root `.env` file.
 *
 * Expected contents (examples):
 *   - JWT_SECRET
 *   - Other secrets shared across multiple services
 *
 * Load order note:
 *   This is called first so that shared values are available before
 *   service-specific overrides are applied.
 */
dotenv.config({
  path: path.join(__dirname, "..", "..", ".env"),
});

/**
 * Load service-specific environment variables from the current service's `.env`.
 *
 * Expected contents (examples):
 *   - MONGO_URI
 *   - PORT
 *   - LOG_LEVEL
 *
 * Because this second call has no explicit path, dotenv will look for a `.env`
 * file in the current working directory. Values here can override shared values
 * if keys are duplicated.
 */
dotenv.config();