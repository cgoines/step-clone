// Jest setup for STEP Clone tests

// Increase timeout for integration tests
jest.setTimeout(30000);

// Mock console methods in non-verbose mode
if (!process.env.VERBOSE_TESTS) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: console.error // Keep error logging
  };
}

// Global test utilities
global.testUtils = {
  // Wait for condition with timeout
  waitFor: (condition, timeout = 5000) => {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const check = () => {
        if (condition()) {
          resolve();
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Timeout waiting for condition'));
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  },

  // Common test data
  testUser: {
    email: 'test@stepclone.com',
    password: 'testpass123',
    firstName: 'Test',
    lastName: 'User'
  },

  adminUser: {
    email: 'admin@stepclone.com',
    password: 'admin123456'
  }
};