/**
 * @file jest.config.js
 * ---------------------------------------------------------
 * @description
 *   Configuration file for Jest testing framework.
 *   Defines the test environment and file-matching patterns
 *   for automated unit and integration testing.
 *
 * @details
 *   - testEnvironment: Uses Node.js environment (backend tests).
 *   - testMatch: Matches all `*.test.js` or `*.spec.js` files
 *     located in `__tests__` directories or anywhere in the repo.
 *
 * @usage
 *   Run tests via: `npm test` or `npx jest`
 * ---------------------------------------------------------
 */

module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.js?(x)", "**/?(*.)+(spec|test).js?(x)"],
};