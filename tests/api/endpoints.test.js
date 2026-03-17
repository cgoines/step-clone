/**
 * API Endpoints Validation Tests
 *
 * These tests ensure all API endpoints are functional and return expected data structures.
 */

const axios = require('axios');

describe('API Endpoints Validation', () => {
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

  const makeAuthenticatedRequest = (url, method = 'GET', data = null) => {
    return axios({
      method,
      url: `${API_BASE_URL}${url}`,
      data,
      headers: { Authorization: `Bearer ${authToken}` }
    });
  };

  describe('Health and System Endpoints', () => {
    test('GET /health should return healthy status', async () => {
      const response = await axios.get(`${API_BASE_URL}/health`);
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('healthy');
      expect(response.data.services.database).toBe('connected');
      expect(response.data.services.redis).toBe('connected');
    });

    test('GET /api should return API info', async () => {
      const response = await axios.get(`${API_BASE_URL}/api`);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('name');
      expect(response.data).toHaveProperty('version');
      expect(response.data).toHaveProperty('endpoints');
    });
  });

  describe('Authentication Endpoints', () => {
    test('POST /api/auth/login should authenticate valid user', async () => {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: global.testUtils.adminUser.email,
        password: global.testUtils.adminUser.password
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('token');
      expect(response.data).toHaveProperty('user');
      expect(response.data.user.email).toBe(global.testUtils.adminUser.email);
    });

    test('POST /api/auth/login should reject invalid credentials', async () => {
      try {
        await axios.post(`${API_BASE_URL}/api/auth/login`, {
          email: 'invalid@example.com',
          password: 'wrongpassword'
        });
        fail('Should have thrown error');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    test('GET /api/auth/verify should verify valid token', async () => {
      const response = await makeAuthenticatedRequest('/api/auth/verify');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('user');
    });
  });

  describe('Countries Endpoints', () => {
    test('GET /api/countries should return countries list', async () => {
      const response = await makeAuthenticatedRequest('/api/countries?limit=50');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('countries');
      expect(Array.isArray(response.data.countries)).toBe(true);
      expect(response.data.countries.length).toBeGreaterThan(0);

      // Check country structure
      const country = response.data.countries[0];
      expect(country).toHaveProperty('id');
      expect(country).toHaveProperty('name');
      expect(country).toHaveProperty('code');
      expect(country).toHaveProperty('risk_level');
    });

    test('GET /api/countries/stats should return country statistics', async () => {
      const response = await makeAuthenticatedRequest('/api/countries/stats');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('total');
      expect(response.data).toHaveProperty('byRiskLevel');
      expect(Array.isArray(response.data.byRiskLevel)).toBe(true);
      expect(typeof response.data.total).toBe('number');
    });
  });

  describe('Alerts Endpoints', () => {
    test('GET /api/alerts should return alerts list', async () => {
      const response = await makeAuthenticatedRequest('/api/alerts?limit=50');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('alerts');
      expect(Array.isArray(response.data.alerts)).toBe(true);

      if (response.data.alerts.length > 0) {
        const alert = response.data.alerts[0];
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('title');
        expect(alert).toHaveProperty('message');
        expect(alert).toHaveProperty('severity');
      }
    });

    test('GET /api/alerts/stats should return alert statistics', async () => {
      const response = await makeAuthenticatedRequest('/api/alerts/stats');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('overall');
      expect(response.data.overall).toHaveProperty('total_alerts');
      expect(response.data.overall).toHaveProperty('active_alerts');
      expect(response.data).toHaveProperty('bySeverity');
    });
  });

  describe('Travel Plans Endpoints', () => {
    test('GET /api/travel-plans should return user travel plans', async () => {
      const response = await makeAuthenticatedRequest('/api/travel-plans?limit=50');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('travelPlans');
      expect(Array.isArray(response.data.travelPlans)).toBe(true);
    });

    test('GET /api/travel-plans/admin should return all travel plans', async () => {
      const response = await makeAuthenticatedRequest('/api/travel-plans/admin?limit=50');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('travelPlans');
      expect(Array.isArray(response.data.travelPlans)).toBe(true);

      if (response.data.travelPlans.length > 0) {
        const plan = response.data.travelPlans[0];
        expect(plan).toHaveProperty('id');
        expect(plan).toHaveProperty('destination');
        expect(plan).toHaveProperty('user');
        expect(plan.destination).toHaveProperty('name');
      }
    });

    test('GET /api/travel-plans/stats should return travel plan statistics', async () => {
      const response = await makeAuthenticatedRequest('/api/travel-plans/stats');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('overview');
      expect(response.data.overview).toHaveProperty('total_plans');
      expect(response.data.overview).toHaveProperty('active_plans');
    });
  });

  describe('Notifications Endpoints', () => {
    test('GET /api/notifications should return user notifications', async () => {
      const response = await makeAuthenticatedRequest('/api/notifications?limit=50');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('notifications');
      expect(Array.isArray(response.data.notifications)).toBe(true);
    });

    test('GET /api/notifications/admin should return all notifications', async () => {
      const response = await makeAuthenticatedRequest('/api/notifications/admin?limit=50');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('notifications');
      expect(Array.isArray(response.data.notifications)).toBe(true);
    });

    test('GET /api/notifications/admin/stats should return notification statistics', async () => {
      const response = await makeAuthenticatedRequest('/api/notifications/admin/stats');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('overall');
      expect(response.data.overall).toHaveProperty('total_notifications');
    });
  });

  describe('Users Endpoints', () => {
    test('GET /api/users/profile should return user profile', async () => {
      const response = await makeAuthenticatedRequest('/api/users/profile');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('email');
    });
  });

  describe('Error Handling', () => {
    test('endpoints should return 401 without authentication', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/travel-plans`);
        fail('Should have thrown error');
      } catch (error) {
        expect(error.response).toBeDefined();
        expect(error.response.status).toBe(401);
      }
    });

    test('non-existent endpoints should return 404', async () => {
      try {
        await makeAuthenticatedRequest('/api/non-existent-endpoint');
        fail('Should have thrown error');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }
    });

    test('invalid JSON should return 400', async () => {
      try {
        await axios.post(`${API_BASE_URL}/api/auth/login`, 'invalid json', {
          headers: { 'Content-Type': 'application/json' }
        });
        fail('Should have thrown error');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });
  });
});