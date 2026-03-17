/**
 * Data Consistency Regression Tests
 *
 * These tests verify that stats endpoints and list endpoints return consistent data.
 * This would have caught the countries (24 vs 195), alerts (0 vs 15), and
 * travel plans (0 vs 30) count mismatches we experienced.
 */

const axios = require('axios');

describe('Data Consistency Regression Tests', () => {
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

  const makeAuthenticatedRequest = (url) => {
    return axios.get(`${API_BASE_URL}${url}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  };

  describe('Countries Data Consistency', () => {
    test('countries stats total should match countries list count', async () => {
      // Get stats
      const statsResponse = await makeAuthenticatedRequest('/api/countries/stats');
      const statsTotal = statsResponse.data.total;

      // Get list with high limit to ensure we get all countries
      const listResponse = await makeAuthenticatedRequest('/api/countries?limit=300');
      const listCount = listResponse.data.countries.length;

      expect(listCount).toBe(statsTotal);
      expect(listCount).toBeGreaterThan(150); // Should have ~195 countries
    });

    test('countries list should return all countries without pagination cutoff', async () => {
      const response = await makeAuthenticatedRequest('/api/countries?limit=300');
      const countries = response.data.countries;

      // Should have all major countries
      const countryNames = countries.map(c => c.name);
      expect(countryNames).toContain('United States');
      expect(countryNames).toContain('United Kingdom');
      expect(countryNames).toContain('China');
      expect(countryNames).toContain('Brazil');
      expect(countryNames).toContain('Australia');

      // Should be close to 195 (UN member states + territories)
      expect(countries.length).toBeGreaterThan(150);
      expect(countries.length).toBeLessThan(250);
    });

    test('countries stats risk level breakdown should match actual countries', async () => {
      const statsResponse = await makeAuthenticatedRequest('/api/countries/stats');
      const riskBreakdown = statsResponse.data.byRiskLevel;

      const listResponse = await makeAuthenticatedRequest('/api/countries?limit=300');
      const countries = listResponse.data.countries;

      // Calculate actual risk level counts
      const actualCounts = {};
      countries.forEach(country => {
        actualCounts[country.risk_level] = (actualCounts[country.risk_level] || 0) + 1;
      });

      // Compare with stats
      riskBreakdown.forEach(stat => {
        const actualCount = actualCounts[stat.risk_level] || 0;
        expect(parseInt(stat.count)).toBe(actualCount);
      });
    });
  });

  describe('Alerts Data Consistency', () => {
    test('alerts stats total should match alerts list count', async () => {
      // Get stats
      const statsResponse = await makeAuthenticatedRequest('/api/alerts/stats');
      const statsTotal = parseInt(statsResponse.data.overall.total_alerts);

      // Get list with high limit
      const listResponse = await makeAuthenticatedRequest('/api/alerts?limit=100');
      const listCount = listResponse.data.alerts.length;

      expect(listCount).toBe(statsTotal);
    });

    test('alerts stats active count should match active alerts in list', async () => {
      const statsResponse = await makeAuthenticatedRequest('/api/alerts/stats');
      const statsActive = parseInt(statsResponse.data.overall.active_alerts);

      const listResponse = await makeAuthenticatedRequest('/api/alerts?limit=100');
      const activeAlerts = listResponse.data.alerts.filter(alert => alert.isActive);

      expect(activeAlerts.length).toBe(statsActive);
    });

    test('alerts stats severity breakdown should match actual alerts', async () => {
      const statsResponse = await makeAuthenticatedRequest('/api/alerts/stats');
      const severityBreakdown = statsResponse.data.bySeverity;

      const listResponse = await makeAuthenticatedRequest('/api/alerts?limit=100');
      const alerts = listResponse.data.alerts;

      // Calculate actual severity counts
      const actualCounts = {};
      alerts.filter(a => a.isActive).forEach(alert => {
        actualCounts[alert.severity] = (actualCounts[alert.severity] || 0) + 1;
      });

      // Compare with stats
      severityBreakdown.forEach(stat => {
        const actualCount = actualCounts[stat.severity] || 0;
        expect(parseInt(stat.count)).toBe(actualCount);
      });
    });
  });

  describe('Travel Plans Data Consistency', () => {
    test('travel plans stats total should match admin list count', async () => {
      // Get stats
      const statsResponse = await makeAuthenticatedRequest('/api/travel-plans/stats');
      const statsTotal = parseInt(statsResponse.data.overview.total_plans);

      // Get admin list with high limit
      const listResponse = await makeAuthenticatedRequest('/api/travel-plans/admin?limit=100');
      const listCount = listResponse.data.travelPlans.length;

      expect(listCount).toBe(statsTotal);
    });

    test('travel plans stats active count should match active plans in admin list', async () => {
      const statsResponse = await makeAuthenticatedRequest('/api/travel-plans/stats');
      const statsActive = parseInt(statsResponse.data.overview.active_plans);

      const listResponse = await makeAuthenticatedRequest('/api/travel-plans/admin?limit=100');
      const activePlans = listResponse.data.travelPlans.filter(plan => plan.isActive);

      expect(activePlans.length).toBe(statsActive);
    });

    test('user travel plans endpoint should return subset of admin endpoint', async () => {
      const adminResponse = await makeAuthenticatedRequest('/api/travel-plans/admin?limit=100');
      const userResponse = await makeAuthenticatedRequest('/api/travel-plans?limit=100');

      // User endpoint should return fewer or equal plans than admin endpoint
      expect(userResponse.data.travelPlans.length).toBeLessThanOrEqual(adminResponse.data.travelPlans.length);
    });
  });

  describe('Notifications Data Consistency', () => {
    test('admin notifications stats should match admin notifications list', async () => {
      // Get admin stats
      const statsResponse = await makeAuthenticatedRequest('/api/notifications/admin/stats');
      const statsTotal = parseInt(statsResponse.data.overall.total_notifications);

      // Get admin list
      const listResponse = await makeAuthenticatedRequest('/api/notifications/admin?limit=100');
      const listCount = listResponse.data.notifications.length;

      expect(listCount).toBe(statsTotal);
    });

    test('user notifications should be subset of admin notifications', async () => {
      const adminResponse = await makeAuthenticatedRequest('/api/notifications/admin?limit=100');
      const userResponse = await makeAuthenticatedRequest('/api/notifications?limit=100');

      // User notifications should be fewer or equal to admin notifications
      expect(userResponse.data.notifications.length).toBeLessThanOrEqual(adminResponse.data.notifications.length);
    });
  });

  describe('Cross-Entity Consistency', () => {
    test('countries referenced in alerts should exist in countries list', async () => {
      const countriesResponse = await makeAuthenticatedRequest('/api/countries?limit=300');
      const alertsResponse = await makeAuthenticatedRequest('/api/alerts?limit=100');

      const countryIds = countriesResponse.data.countries.map(c => c.id);
      const alertCountryIds = alertsResponse.data.alerts
        .filter(alert => alert.country && alert.country.id)
        .map(alert => alert.country.id);

      alertCountryIds.forEach(countryId => {
        if (countryId !== undefined) {
          expect(countryIds).toContain(countryId);
        }
      });
    });

    test('countries referenced in travel plans should exist in countries list', async () => {
      const countriesResponse = await makeAuthenticatedRequest('/api/countries?limit=300');
      const plansResponse = await makeAuthenticatedRequest('/api/travel-plans/admin?limit=100');

      const countryIds = countriesResponse.data.countries.map(c => c.id);
      const planCountryIds = plansResponse.data.travelPlans
        .filter(plan => plan.destination)
        .map(plan => plan.destination.id);

      planCountryIds.forEach(countryId => {
        expect(countryIds).toContain(countryId);
      });
    });
  });
});