/**
 * Route Ordering Regression Tests
 *
 * These tests verify that specific routes (like /stats) are properly ordered
 * before parameterized routes (like /:id) to prevent matching issues.
 * This would have caught the route ordering bugs we fixed in countries,
 * alerts, and travel plans where /stats was being matched as /:id.
 */

const axios = require('axios');

describe('Route Ordering Regression Tests', () => {
  let authToken;
  const API_BASE_URL = global.__API_BASE_URL__ || 'http://localhost:9999';

  beforeAll(async () => {
    // Get auth token
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: global.testUtils.adminUser.email,
      password: global.testUtils.adminUser.password
    });
    authToken = response.data.token;
  });

  const makeAuthenticatedRequest = async (url, expectError = false) => {
    try {
      const response = await axios.get(`${API_BASE_URL}${url}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      return response;
    } catch (error) {
      if (expectError) {
        return error.response;
      }
      throw error;
    }
  };

  describe('Countries Route Ordering', () => {
    test('/api/countries/stats should return stats, not 404 or UUID error', async () => {
      const response = await makeAuthenticatedRequest('/api/countries/stats');

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('total');
      expect(response.data).toHaveProperty('byRiskLevel');
      expect(typeof response.data.total).toBe('number');
    });

    test('/api/countries/:id should work with valid UUID', async () => {
      // First get a country to test with
      const countriesResponse = await makeAuthenticatedRequest('/api/countries?limit=1');
      const countryId = countriesResponse.data.countries[0]?.id;

      if (countryId) {
        const response = await makeAuthenticatedRequest(`/api/countries/${countryId}`);
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('id');
        expect(response.data).toHaveProperty('name');
      }
    });

    test('/api/countries/:id should return 404 for non-existent ID, not stats data', async () => {
      const fakeId = '99999';
      const response = await makeAuthenticatedRequest(`/api/countries/${fakeId}`, true);

      expect(response.status).toBe(404);
      // Should not return stats data
      expect(response.data).not.toHaveProperty('total');
      expect(response.data).not.toHaveProperty('byRiskLevel');
    });
  });

  describe('Alerts Route Ordering', () => {
    test('/api/alerts/stats should return stats, not UUID error', async () => {
      const response = await makeAuthenticatedRequest('/api/alerts/stats');

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('overall');
      expect(response.data.overall).toHaveProperty('total_alerts');
      expect(response.data).toHaveProperty('bySeverity');
    });

    test('/api/alerts/:id should work with valid UUID', async () => {
      // First get an alert to test with
      const alertsResponse = await makeAuthenticatedRequest('/api/alerts?limit=1');
      const alertId = alertsResponse.data.alerts[0]?.id;

      if (alertId) {
        const response = await makeAuthenticatedRequest(`/api/alerts/${alertId}`);
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('id');
        expect(response.data).toHaveProperty('title');
      }
    });

    test('/api/alerts/:id should return 404 for non-existent UUID, not stats data', async () => {
      const fakeId = '00000000-0000-4000-8000-000000000000';
      const response = await makeAuthenticatedRequest(`/api/alerts/${fakeId}`, true);

      expect(response.status).toBe(404);
      expect(response.data).not.toHaveProperty('overall');
    });
  });

  describe('Travel Plans Route Ordering', () => {
    test('/api/travel-plans/stats should return stats, not UUID error', async () => {
      const response = await makeAuthenticatedRequest('/api/travel-plans/stats');

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('overview');
      expect(response.data.overview).toHaveProperty('total_plans');
    });

    test('/api/travel-plans/admin should return admin list, not UUID error', async () => {
      const response = await makeAuthenticatedRequest('/api/travel-plans/admin');

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('travelPlans');
      expect(Array.isArray(response.data.travelPlans)).toBe(true);
    });

    test('/api/travel-plans/:id should work with valid UUID', async () => {
      // First get a travel plan to test with
      const plansResponse = await makeAuthenticatedRequest('/api/travel-plans?limit=1');
      const planId = plansResponse.data.travelPlans[0]?.id;

      if (planId) {
        const response = await makeAuthenticatedRequest(`/api/travel-plans/${planId}`);
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('id');
      }
    });

    test('/api/travel-plans/:id should return 404 for non-existent UUID, not stats data', async () => {
      const fakeId = '00000000-0000-4000-8000-000000000000';
      const response = await makeAuthenticatedRequest(`/api/travel-plans/${fakeId}`, true);

      expect(response.status).toBe(404);
      expect(response.data).not.toHaveProperty('overview');
    });
  });

  describe('Notifications Route Ordering', () => {
    test('/api/notifications/admin/stats should return admin stats', async () => {
      const response = await makeAuthenticatedRequest('/api/notifications/admin/stats');

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('overall');
      expect(response.data.overall).toHaveProperty('total_notifications');
    });

    test('/api/notifications/admin should return admin notifications list', async () => {
      const response = await makeAuthenticatedRequest('/api/notifications/admin');

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('notifications');
      expect(Array.isArray(response.data.notifications)).toBe(true);
    });

    test('/api/notifications/stats should return user stats', async () => {
      const response = await makeAuthenticatedRequest('/api/notifications/stats');

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('overall');
    });
  });

  describe('Route Specificity Tests', () => {
    test('specific routes should not be confused with parameter routes', async () => {
      // Test that "stats" is not treated as an ID parameter
      const routesToTest = [
        '/api/countries/stats',
        '/api/alerts/stats',
        '/api/travel-plans/stats',
        '/api/travel-plans/admin',
        '/api/notifications/admin',
        '/api/notifications/admin/stats'
      ];

      for (const route of routesToTest) {
        const response = await makeAuthenticatedRequest(route);
        expect(response.status).toBe(200);

        // Should not contain UUID error messages
        const responseText = JSON.stringify(response.data);
        expect(responseText).not.toContain('invalid input syntax for type uuid');
        expect(responseText).not.toContain('stats');

        // Should contain expected data structures
        if (route.includes('/stats')) {
          expect(
            response.data.hasOwnProperty('overall') ||
            response.data.hasOwnProperty('total') ||
            response.data.hasOwnProperty('overview')
          ).toBe(true);
        } else if (route.includes('/admin') && !route.includes('/stats')) {
          expect(
            response.data.hasOwnProperty('notifications') ||
            response.data.hasOwnProperty('travelPlans')
          ).toBe(true);
        }
      }
    });

    test('parameter routes should still work correctly', async () => {
      // Test actual ID parameters work
      const countriesResponse = await makeAuthenticatedRequest('/api/countries?limit=1');
      const countryId = countriesResponse.data.countries[0]?.id;

      if (countryId) {
        const countryResponse = await makeAuthenticatedRequest(`/api/countries/${countryId}`);
        expect(countryResponse.status).toBe(200);
        expect(countryResponse.data.id).toBe(countryId);
      }
    });
  });
});