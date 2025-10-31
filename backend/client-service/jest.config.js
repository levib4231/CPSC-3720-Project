/**
 * @file jest.config.js
 * ---------------------------------------------------------
 * @description
 *   Jest configuration file for Node-based backend services.
 *   Ensures that all `.test.js` and `.spec.js` files under
 *   `__tests__` or any module directory are executed in a
 *   Node environment.
 *
 * @usage
 *   npx jest              # Run all tests
 *   npx jest --watchAll   # Watch mode for live re-runs
 * ---------------------------------------------------------
 */

module.exports = {
  testEnvironment: "node",
  testMatch: [
    "**/__tests__/**/*.js?(x)",
    "**/?(*.)+(spec|test).js?(x)"
  ]
};