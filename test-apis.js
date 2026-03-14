#!/usr/bin/env node

/**
 * STEP Clone API Test Script
 *
 * This script tests the major API endpoints to ensure everything is working correctly.
 * Run with: node test-apis.js
 */

const https = require('https');

const API_BASE = 'http://localhost:9999/api';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const data = options.body ? JSON.stringify(options.body) : null;

    const req = require(url.startsWith('https:') ? 'https' : 'http').request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

async function testEndpoint(name, url, options = {}) {
  try {
    log('blue', `Testing ${name}...`);
    const response = await makeRequest(url, options);

    if (response.status >= 200 && response.status < 300) {
      log('green', `✓ ${name} - Success (${response.status})`);
      return response.data;
    } else {
      log('red', `✗ ${name} - Failed (${response.status})`);
      console.log('Response:', response.data);
      return null;
    }
  } catch (error) {
    log('red', `✗ ${name} - Error: ${error.message}`);
    return null;
  }
}

async function main() {
  log('yellow', '🧪 STEP Clone API Test Suite\n');

  let token = null;

  // Test 1: Login
  const loginResult = await testEndpoint('User Login', `${API_BASE}/auth/login`, {
    method: 'POST',
    body: {
      email: 'demo@stepclone.com',
      password: 'demo123456'
    }
  });

  if (loginResult && loginResult.token) {
    token = loginResult.token;
    log('green', `Token obtained: ${token.substring(0, 20)}...\n`);
  } else {
    log('red', '❌ Cannot continue without authentication token');
    return;
  }

  const authHeaders = {
    'Authorization': `Bearer ${token}`
  };

  // Test 2: User Profile
  await testEndpoint('User Profile', `${API_BASE}/users/profile`, {
    headers: authHeaders
  });

  // Test 3: Countries List
  const countriesResult = await testEndpoint('Countries List', `${API_BASE}/countries`, {
    headers: authHeaders
  });

  // Test 4: Alerts List
  const alertsResult = await testEndpoint('Alerts List', `${API_BASE}/alerts`, {
    headers: authHeaders
  });

  // Test 5: Travel Plans List
  await testEndpoint('Travel Plans List', `${API_BASE}/travel-plans`, {
    headers: authHeaders
  });

  // Test 6: System Health
  await testEndpoint('System Health', 'http://localhost:9999/health');

  // Test 7: Create a Travel Plan
  if (countriesResult && countriesResult.countries && countriesResult.countries.length > 0) {
    const franceCountry = countriesResult.countries.find(c => c.name === 'France');
    if (franceCountry) {
      const travelPlanResult = await testEndpoint('Create Travel Plan', `${API_BASE}/travel-plans`, {
        method: 'POST',
        headers: authHeaders,
        body: {
          title: 'API Test Trip',
          description: 'Test travel plan created by API test script',
          startDate: '2024-06-01',
          endDate: '2024-06-07',
          countryId: franceCountry.id,
          emergencyContacts: [
            {
              name: 'Test Contact',
              relationship: 'Friend',
              phone: '+1234567890',
              email: 'test@example.com'
            }
          ]
        }
      });

      // Clean up: Delete the test travel plan
      if (travelPlanResult && travelPlanResult.id) {
        await testEndpoint('Delete Test Travel Plan', `${API_BASE}/travel-plans/${travelPlanResult.id}`, {
          method: 'DELETE',
          headers: authHeaders
        });
      }
    }
  }

  // Test 8: Token Verification
  await testEndpoint('Token Verification', `${API_BASE}/auth/verify`, {
    headers: authHeaders
  });

  // Summary
  log('yellow', '\n📊 Test Summary:');
  log('blue', '• Admin Dashboard: http://localhost:3001');
  log('blue', '• API Documentation: http://localhost:5173');
  log('blue', '• API Base URL: http://localhost:9999/api');

  log('yellow', '\n🔐 Demo Credentials:');
  log('green', '• Email: demo@stepclone.com');
  log('green', '• Password: demo123456');

  if (countriesResult && countriesResult.countries) {
    log('yellow', `\n🌍 Countries Available: ${countriesResult.countries.length}`);
    const riskCounts = countriesResult.countries.reduce((acc, country) => {
      acc[country.risk_level] = (acc[country.risk_level] || 0) + 1;
      return acc;
    }, {});

    Object.entries(riskCounts).forEach(([risk, count]) => {
      log('blue', `• ${risk}: ${count} countries`);
    });
  }

  if (alertsResult && alertsResult.alerts) {
    log('yellow', `\n🚨 Active Alerts: ${alertsResult.alerts.length}`);
    const severityCounts = alertsResult.alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {});

    Object.entries(severityCounts).forEach(([severity, count]) => {
      log('blue', `• ${severity}: ${count} alerts`);
    });
  }

  log('green', '\n✅ API testing complete!');
}

main().catch(error => {
  log('red', `Fatal error: ${error.message}`);
  process.exit(1);
});