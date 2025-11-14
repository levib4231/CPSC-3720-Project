export default {
  testEnvironment: 'node',
  // ESM support
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  setupFilesAfterEnv: ['<rootDir>/setup.js']
};