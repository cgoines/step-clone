module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js'
  ],

  // Global setup and teardown
  globalSetup: '<rootDir>/tests/setup/global.setup.js',
  globalTeardown: '<rootDir>/tests/setup/global.teardown.js',

  // Setup files run before each test file
  setupFilesAfterEnv: [
    '<rootDir>/tests/utils/testUtils.js'
  ],

  // Coverage configuration
  collectCoverage: false,
  collectCoverageFrom: [
    'routes/**/*.js',
    'services/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  coverageDirectory: '<rootDir>/tests/coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Test timeout (30 seconds for API tests)
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Handle ES modules if needed
  transform: {},

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true
};