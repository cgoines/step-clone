const axios = require('axios');
const { pool } = require('../config/database');
const Redis = require('ioredis');
const logger = require('../utils/logger');

require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:9999';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

/**
 * Check database connectivity
 */
async function checkDatabase() {
    try {
        const client = await pool.connect();
        await client.query('SELECT 1 as healthy');
        client.release();

        // Check table counts
        const stats = await client.query(`
            SELECT
                (SELECT COUNT(*) FROM users) as users,
                (SELECT COUNT(*) FROM countries) as countries,
                (SELECT COUNT(*) FROM alerts WHERE is_active = true) as active_alerts,
                (SELECT COUNT(*) FROM travel_plans WHERE is_active = true) as active_travel_plans
        `);

        return {
            status: 'healthy',
            details: 'Database connection successful',
            stats: stats.rows[0]
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            details: `Database error: ${error.message}`
        };
    }
}

/**
 * Check Redis connectivity
 */
async function checkRedis() {
    let redis;
    try {
        redis = new Redis(REDIS_URL);
        await redis.ping();

        // Get some basic Redis info
        const info = await redis.info('memory');
        const memoryMatch = info.match(/used_memory_human:(.+)/);
        const memoryUsage = memoryMatch ? memoryMatch[1].trim() : 'unknown';

        return {
            status: 'healthy',
            details: 'Redis connection successful',
            memoryUsage
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            details: `Redis error: ${error.message}`
        };
    } finally {
        if (redis) {
            redis.disconnect();
        }
    }
}

/**
 * Check API endpoints
 */
async function checkAPIEndpoints() {
    const endpoints = [
        { path: '/health', method: 'GET' },
        { path: '/api', method: 'GET' },
        { path: '/api/countries', method: 'GET' },
        { path: '/api/alerts', method: 'GET' },
        { path: '/api/alerts/stats', method: 'GET' }
    ];

    const results = [];

    for (const endpoint of endpoints) {
        try {
            const startTime = Date.now();
            const response = await axios({
                method: endpoint.method,
                url: `${API_BASE_URL}${endpoint.path}`,
                timeout: 5000
            });
            const responseTime = Date.now() - startTime;

            results.push({
                endpoint: endpoint.path,
                status: 'healthy',
                httpStatus: response.status,
                responseTime: `${responseTime}ms`
            });
        } catch (error) {
            results.push({
                endpoint: endpoint.path,
                status: 'unhealthy',
                error: error.response?.status || error.message
            });
        }
    }

    return results;
}

/**
 * Check queue health
 */
async function checkQueues() {
    let redis;
    try {
        redis = new Redis(REDIS_URL);

        const { Queue } = require('bullmq');
        const alertQueue = new Queue('alerts', { connection: redis });
        const smsQueue = new Queue('sms', { connection: redis });
        const pushQueue = new Queue('push', { connection: redis });
        const emailQueue = new Queue('email', { connection: redis });

        const queueStats = await Promise.all([
            alertQueue.getJobCounts(),
            smsQueue.getJobCounts(),
            pushQueue.getJobCounts(),
            emailQueue.getJobCounts()
        ]);

        return {
            status: 'healthy',
            queues: {
                alerts: queueStats[0],
                sms: queueStats[1],
                push: queueStats[2],
                email: queueStats[3]
            }
        };
    } catch (error) {
        return {
            status: 'unhealthy',
            details: `Queue error: ${error.message}`
        };
    } finally {
        if (redis) {
            redis.disconnect();
        }
    }
}

/**
 * Test notification services
 */
async function checkNotificationServices() {
    const services = {};

    // Check Twilio (SMS)
    try {
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            const twilio = require('twilio');
            const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

            // Just check if we can authenticate
            await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
            services.twilio = { status: 'healthy', details: 'Authentication successful' };
        } else {
            services.twilio = { status: 'not_configured', details: 'Twilio credentials not provided' };
        }
    } catch (error) {
        services.twilio = { status: 'unhealthy', details: `Twilio error: ${error.message}` };
    }

    // Check Firebase (Push notifications)
    try {
        if (process.env.FIREBASE_PROJECT_ID) {
            // Firebase Admin SDK should be initialized in pushNotificationService
            services.firebase = { status: 'configured', details: 'Firebase project ID configured' };
        } else {
            services.firebase = { status: 'not_configured', details: 'Firebase not configured' };
        }
    } catch (error) {
        services.firebase = { status: 'unhealthy', details: `Firebase error: ${error.message}` };
    }

    // Check Email service
    try {
        if (process.env.SMTP_HOST || process.env.EMAIL_SERVICE) {
            services.email = { status: 'configured', details: 'Email service configured' };
        } else {
            services.email = { status: 'not_configured', details: 'Email service not configured' };
        }
    } catch (error) {
        services.email = { status: 'unhealthy', details: `Email error: ${error.message}` };
    }

    return services;
}

/**
 * Run comprehensive health check
 */
async function runHealthCheck(options = {}) {
    const checks = {
        skipAPI: false,
        skipServices: false,
        verbose: false,
        ...options
    };

    console.log('🏥 STEP Clone Health Check\n');
    console.log(`Checking system health at ${new Date().toISOString()}\n`);

    const results = {
        timestamp: new Date().toISOString(),
        overall: 'healthy',
        checks: {}
    };

    // Database check
    console.log('📊 Checking database...');
    results.checks.database = await checkDatabase();
    console.log(`   Status: ${results.checks.database.status}`);
    if (checks.verbose && results.checks.database.stats) {
        console.log(`   Stats: ${JSON.stringify(results.checks.database.stats)}`);
    }

    // Redis check
    console.log('\n🔴 Checking Redis...');
    results.checks.redis = await checkRedis();
    console.log(`   Status: ${results.checks.redis.status}`);
    if (checks.verbose && results.checks.redis.memoryUsage) {
        console.log(`   Memory Usage: ${results.checks.redis.memoryUsage}`);
    }

    // Queue check
    console.log('\n📬 Checking queues...');
    results.checks.queues = await checkQueues();
    console.log(`   Status: ${results.checks.queues.status}`);

    // API endpoints check
    if (!checks.skipAPI) {
        console.log('\n🌐 Checking API endpoints...');
        results.checks.api = await checkAPIEndpoints();

        for (const endpoint of results.checks.api) {
            const status = endpoint.status === 'healthy' ? '✅' : '❌';
            console.log(`   ${status} ${endpoint.endpoint} - ${endpoint.status}`);
            if (checks.verbose && endpoint.responseTime) {
                console.log(`      Response time: ${endpoint.responseTime}`);
            }
        }
    }

    // Notification services check
    if (!checks.skipServices) {
        console.log('\n📱 Checking notification services...');
        results.checks.services = await checkNotificationServices();

        for (const [service, result] of Object.entries(results.checks.services)) {
            const status = result.status === 'healthy' || result.status === 'configured' ? '✅' :
                          result.status === 'not_configured' ? '⚠️' : '❌';
            console.log(`   ${status} ${service} - ${result.status}`);
            if (checks.verbose) {
                console.log(`      ${result.details}`);
            }
        }
    }

    // Determine overall health
    const allChecks = Object.values(results.checks);
    const hasUnhealthy = allChecks.some(check => {
        if (Array.isArray(check)) {
            return check.some(item => item.status === 'unhealthy');
        }
        if (typeof check === 'object' && check.status) {
            return check.status === 'unhealthy';
        }
        if (typeof check === 'object') {
            return Object.values(check).some(item => item.status === 'unhealthy');
        }
        return false;
    });

    results.overall = hasUnhealthy ? 'unhealthy' : 'healthy';

    console.log(`\n🎯 Overall System Health: ${results.overall.toUpperCase()}`);

    if (results.overall === 'unhealthy') {
        console.log('\n⚠️  Issues detected. Check the logs for detailed error information.');
    } else {
        console.log('\n✨ All systems operational!');
    }

    return results;
}

// Command line interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};

    // Parse command line arguments
    args.forEach(arg => {
        if (arg === '--skip-api') options.skipAPI = true;
        if (arg === '--skip-services') options.skipServices = true;
        if (arg === '--verbose' || arg === '-v') options.verbose = true;
    });

    runHealthCheck(options)
        .then((results) => {
            if (results.overall === 'unhealthy') {
                process.exit(1);
            } else {
                process.exit(0);
            }
        })
        .catch((error) => {
            console.error('Health check failed:', error);
            process.exit(1);
        });
}

module.exports = {
    runHealthCheck,
    checkDatabase,
    checkRedis,
    checkAPIEndpoints,
    checkQueues,
    checkNotificationServices
};