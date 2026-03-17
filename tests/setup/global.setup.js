// Global setup for STEP Clone tests
const axios = require('axios');
const { execSync } = require('child_process');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:9999';

module.exports = async () => {
  console.log('🚀 Setting up regression tests...');

  // Wait for API to be available
  const maxRetries = 30;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await axios.get(`${API_BASE_URL}/health`);
      console.log('✅ API is healthy and ready');
      break;
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        throw new Error(`API not available after ${maxRetries} retries. Please start the application first.`);
      }
      console.log(`⏳ Waiting for API... (${retries}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Set global API base URL
  global.__API_BASE_URL__ = API_BASE_URL;

  console.log('✅ Test environment ready');
};