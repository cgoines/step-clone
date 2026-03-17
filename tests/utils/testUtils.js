/**
 * Test Utilities
 *
 * Common utilities and test data for STEP Clone regression tests
 */

const testUtils = {
  // Test user credentials - should match seeded admin user
  adminUser: {
    email: 'admin@stepclone.com',
    password: 'admin123456'
  },

  // Test user credentials for regular user tests
  testUser: {
    email: 'demo@stepclone.com',
    password: 'demo123456'
  },

  // Common test data patterns
  testData: {
    // Valid UUID pattern for testing
    validUUID: '12345678-1234-1234-1234-123456789abc',

    // Sample country data structure
    sampleCountry: {
      name: 'Test Country',
      code: 'TC',
      risk_level: 'low'
    },

    // Sample alert data structure
    sampleAlert: {
      title: 'Test Alert',
      message: 'This is a test alert',
      severity: 'medium',
      isActive: true
    },

    // Sample travel plan data structure
    sampleTravelPlan: {
      destination: 'Test Destination',
      departure_date: '2024-12-01',
      return_date: '2024-12-15',
      purpose: 'tourism'
    }
  },

  // Helper functions for common test operations
  helpers: {
    /**
     * Generate a random valid UUID for testing
     */
    generateTestUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    },

    /**
     * Wait for a specified amount of time
     * @param {number} ms - Milliseconds to wait
     */
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Retry a function up to maxRetries times
     * @param {Function} fn - Function to retry
     * @param {number} maxRetries - Maximum number of retries
     * @param {number} delay - Delay between retries in ms
     */
    async retry(fn, maxRetries = 3, delay = 1000) {
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await fn();
        } catch (error) {
          if (i === maxRetries - 1) throw error;
          await this.sleep(delay);
        }
      }
    },

    /**
     * Validate response structure matches expected schema
     * @param {Object} response - Response object to validate
     * @param {Object} schema - Expected schema structure
     */
    validateResponseSchema(response, schema) {
      for (const key in schema) {
        if (schema.hasOwnProperty(key)) {
          if (!response.hasOwnProperty(key)) {
            throw new Error(`Missing required field: ${key}`);
          }

          if (typeof schema[key] === 'object' && schema[key] !== null) {
            if (Array.isArray(schema[key])) {
              if (!Array.isArray(response[key])) {
                throw new Error(`Field ${key} should be an array`);
              }
            } else {
              this.validateResponseSchema(response[key], schema[key]);
            }
          } else if (typeof response[key] !== typeof schema[key]) {
            throw new Error(`Field ${key} has incorrect type. Expected: ${typeof schema[key]}, Got: ${typeof response[key]}`);
          }
        }
      }
    }
  },

  // Expected response schemas for validation
  schemas: {
    country: {
      id: 'string',
      name: 'string',
      code: 'string',
      risk_level: 'string'
    },

    alert: {
      id: 'string',
      title: 'string',
      message: 'string',
      severity: 'string',
      isActive: 'boolean'
    },

    travelPlan: {
      id: 'string',
      destination: 'string',
      user: {}
    },

    user: {
      id: 'string',
      email: 'string'
    },

    notification: {
      id: 'string',
      message: 'string'
    },

    stats: {
      total: 'number'
    }
  }
};

// Set up global test utils
global.testUtils = testUtils;

module.exports = testUtils;