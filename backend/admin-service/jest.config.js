/**
 * @file jest.config.js
 * ---------------------------------------------------------
 * @description
 *   Jest configuration for Node.js backend tests.
 *   - Uses Node environment
 *   - Matches test files in __tests__ or any *.spec.js / *.test.js
 *
 * Usage:
 *   npx jest
 *   npx jest --watchAll
 * ---------------------------------------------------------
 */

module.exports = {
  testEnvironment: "node",
  testMatch: [
    "**/__tests__/**/*.js?(x)",
    "**/?(*.)+(spec|test).js?(x)"
  ]
};