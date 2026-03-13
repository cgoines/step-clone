const request = require('supertest');
const express = require('express');

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// Mock database module
jest.mock('../config/database', () => ({
    query: jest.fn(),
    pool: {
        connect: jest.fn(() => ({
            query: jest.fn(),
            release: jest.fn()
        }))
    }
}));

// Mock services
jest.mock('../services/queueService', () => ({
    initializeQueues: jest.fn().mockResolvedValue(true),
    queueAlert: jest.fn().mockResolvedValue({ id: 'test-job' })
}));

jest.mock('../services/smsService', () => ({
    sendSMS: jest.fn().mockResolvedValue({ sid: 'test-sid' })
}));

jest.mock('../services/pushNotificationService', () => ({
    sendNotification: jest.fn().mockResolvedValue([{ success: true }]),
    registerDeviceToken: jest.fn().mockResolvedValue({ id: 'test-token' })
}));

jest.mock('../services/emailService', () => ({
    sendEmail: jest.fn().mockResolvedValue({ messageId: 'test-message' }),
    sendWelcomeEmail: jest.fn().mockResolvedValue(true)
}));

const { query } = require('../config/database');

describe('STEP Clone API', () => {
    let app;

    beforeAll(async () => {
        // Import the app after mocks are set up
        app = require('../server');
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Health Check', () => {
        test('GET /health should return healthy status', async () => {
            query.mockResolvedValueOnce({ rows: [{ result: 1 }] });

            const response = await request(app)
                .get('/health')
                .expect(200);

            expect(response.body).toHaveProperty('status', 'healthy');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('services');
        });
    });

    describe('API Info', () => {
        test('GET /api should return API information', async () => {
            const response = await request(app)
                .get('/api')
                .expect(200);

            expect(response.body).toHaveProperty('name', 'STEP Clone API');
            expect(response.body).toHaveProperty('description');
            expect(response.body).toHaveProperty('endpoints');
        });
    });

    describe('Authentication', () => {
        test('POST /api/auth/register should create a new user', async () => {
            // Mock user doesn't exist
            query.mockResolvedValueOnce({ rows: [] });
            // Mock user creation
            query.mockResolvedValueOnce({
                rows: [{
                    id: 'test-user-id',
                    email: 'test@example.com',
                    first_name: 'Test',
                    last_name: 'User',
                    phone: '+1234567890',
                    created_at: new Date()
                }]
            });

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'testpassword123',
                    firstName: 'Test',
                    lastName: 'User',
                    phone: '+1234567890'
                })
                .expect(201);

            expect(response.body).toHaveProperty('message', 'User registered successfully');
            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('token');
        });

        test('POST /api/auth/register should fail with invalid email', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'invalid-email',
                    password: 'testpassword123',
                    firstName: 'Test',
                    lastName: 'User'
                })
                .expect(400);

            expect(response.body).toHaveProperty('error', 'Validation failed');
            expect(response.body).toHaveProperty('details');
        });

        test('POST /api/auth/login should authenticate valid user', async () => {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('testpassword123', 12);

            query.mockResolvedValueOnce({
                rows: [{
                    id: 'test-user-id',
                    email: 'test@example.com',
                    password_hash: hashedPassword,
                    first_name: 'Test',
                    last_name: 'User',
                    phone: '+1234567890',
                    is_verified: true,
                    sms_enabled: true,
                    push_enabled: true,
                    email_enabled: true
                }]
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'testpassword123'
                })
                .expect(200);

            expect(response.body).toHaveProperty('message', 'Login successful');
            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('token');
        });

        test('POST /api/auth/login should fail with invalid credentials', async () => {
            query.mockResolvedValueOnce({ rows: [] });

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'wrongpassword'
                })
                .expect(401);

            expect(response.body).toHaveProperty('error', 'Invalid credentials');
        });
    });

    describe('Countries', () => {
        test('GET /api/countries should return list of countries', async () => {
            query.mockResolvedValueOnce({
                rows: [
                    {
                        id: 1,
                        name: 'United States',
                        code: 'US',
                        iso_code: 'USA',
                        latitude: 39.8283,
                        longitude: -98.5795,
                        risk_level: 'low'
                    }
                ]
            });

            query.mockResolvedValueOnce({
                rows: [{ total: 1 }]
            });

            const response = await request(app)
                .get('/api/countries')
                .expect(200);

            expect(response.body).toHaveProperty('countries');
            expect(response.body).toHaveProperty('pagination');
            expect(Array.isArray(response.body.countries)).toBe(true);
        });

        test('GET /api/countries/search should return search results', async () => {
            query.mockResolvedValueOnce({
                rows: [
                    {
                        id: 1,
                        name: 'United States',
                        code: 'US',
                        iso_code: 'USA',
                        risk_level: 'low'
                    }
                ]
            });

            const response = await request(app)
                .get('/api/countries/search')
                .query({ q: 'United' })
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('Alerts', () => {
        test('GET /api/alerts should return public alerts', async () => {
            query.mockResolvedValueOnce({
                rows: [
                    {
                        id: 'alert-1',
                        title: 'Test Alert',
                        message: 'This is a test alert',
                        severity: 'warning',
                        alert_type: 'travel_advisory',
                        country_name: 'United States',
                        country_code: 'US',
                        is_active: true,
                        created_at: new Date()
                    }
                ]
            });

            query.mockResolvedValueOnce({
                rows: [{ total: 1 }]
            });

            const response = await request(app)
                .get('/api/alerts')
                .expect(200);

            expect(response.body).toHaveProperty('alerts');
            expect(response.body).toHaveProperty('pagination');
            expect(Array.isArray(response.body.alerts)).toBe(true);
        });

        test('GET /api/alerts/stats should return alert statistics', async () => {
            query.mockResolvedValueOnce({
                rows: [{
                    total_alerts: 10,
                    active_alerts: 8,
                    emergency_alerts: 1,
                    critical_alerts: 2
                }]
            });

            query.mockResolvedValueOnce({
                rows: [
                    { alert_type: 'travel_advisory', count: 5 },
                    { alert_type: 'weather', count: 3 }
                ]
            });

            query.mockResolvedValueOnce({
                rows: [
                    { severity: 'emergency', count: 1 },
                    { severity: 'critical', count: 2 }
                ]
            });

            query.mockResolvedValueOnce({
                rows: [
                    { name: 'United States', code: 'US', alert_count: 3 }
                ]
            });

            const response = await request(app)
                .get('/api/alerts/stats')
                .expect(200);

            expect(response.body).toHaveProperty('overall');
            expect(response.body).toHaveProperty('byType');
            expect(response.body).toHaveProperty('bySeverity');
            expect(response.body).toHaveProperty('topCountries');
        });
    });

    describe('Error Handling', () => {
        test('should return 404 for non-existent endpoints', async () => {
            const response = await request(app)
                .get('/api/nonexistent')
                .expect(404);

            expect(response.body).toHaveProperty('error', 'Endpoint not found');
        });

        test('should handle database errors gracefully', async () => {
            query.mockRejectedValueOnce(new Error('Database connection failed'));

            const response = await request(app)
                .get('/health')
                .expect(503);

            expect(response.body).toHaveProperty('status', 'unhealthy');
        });
    });
});

describe('Validation Tests', () => {
    test('should validate email format', async () => {
        const response = await request(require('../server'))
            .post('/api/auth/register')
            .send({
                email: 'invalid-email',
                password: 'testpassword123',
                firstName: 'Test',
                lastName: 'User'
            })
            .expect(400);

        expect(response.body.error).toBe('Validation failed');
    });

    test('should validate password length', async () => {
        const response = await request(require('../server'))
            .post('/api/auth/register')
            .send({
                email: 'test@example.com',
                password: '123',
                firstName: 'Test',
                lastName: 'User'
            })
            .expect(400);

        expect(response.body.error).toBe('Validation failed');
        expect(response.body.details[0].msg).toContain('Password must be at least 8 characters');
    });
});

// Clean up after tests
afterAll(async () => {
    // Close any open handles
    await new Promise(resolve => setTimeout(resolve, 100));
});