const { faker } = require('faker');
const { query, transaction } = require('../config/database');
const { queueAlert } = require('../services/queueService');
const logger = require('../utils/logger');

require('dotenv').config();

const alertTypes = ['travel_advisory', 'weather', 'security', 'health', 'embassy'];
const severities = ['info', 'warning', 'critical', 'emergency'];
const purposes = ['business', 'tourism', 'study', 'family'];

/**
 * Generate fake users for load testing
 * @param {number} count - Number of users to generate
 */
async function generateFakeUsers(count) {
    logger.info(`Generating ${count} fake users...`);

    const bcrypt = require('bcryptjs');
    const users = [];

    // Get available countries
    const countriesResult = await query('SELECT id FROM countries LIMIT 20');
    const countryIds = countriesResult.rows.map(row => row.id);

    const batchSize = 100;
    for (let i = 0; i < count; i += batchSize) {
        const batch = [];
        const currentBatchSize = Math.min(batchSize, count - i);

        for (let j = 0; j < currentBatchSize; j++) {
            const email = faker.internet.email();
            const password = await bcrypt.hash('test123456', 10); // Lower cost for speed
            const firstName = faker.person.firstName();
            const lastName = faker.person.lastName();
            const phone = faker.phone.number('+1##########');
            const countryId = countryIds[Math.floor(Math.random() * countryIds.length)];

            batch.push([email, password, firstName, lastName, phone, countryId, true]);
        }

        try {
            // Use batch insert for better performance
            const placeholders = batch.map((_, index) => {
                const base = index * 7;
                return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7})`;
            }).join(', ');

            const values = batch.flat();

            const result = await query(`
                INSERT INTO users (email, password_hash, first_name, last_name, phone, country_id, is_verified)
                VALUES ${placeholders}
                ON CONFLICT (email) DO NOTHING
                RETURNING id
            `, values);

            users.push(...result.rows.map(row => row.id));

        } catch (error) {
            logger.error(`Error inserting user batch:`, error);
        }

        // Show progress
        if (i % 500 === 0) {
            logger.info(`Generated ${Math.min(i + batchSize, count)}/${count} users`);
        }
    }

    logger.info(`Generated ${users.length} fake users`);
    return users;
}

/**
 * Generate fake travel plans
 * @param {Array} userIds - Array of user IDs
 * @param {number} plansPerUser - Average number of plans per user
 */
async function generateTravelPlans(userIds, plansPerUser = 2) {
    logger.info(`Generating travel plans for ${userIds.length} users...`);

    // Get available countries
    const countriesResult = await query('SELECT id FROM countries');
    const countryIds = countriesResult.rows.map(row => row.id);

    const travelPlans = [];
    const batchSize = 200;

    for (let i = 0; i < userIds.length; i += batchSize) {
        const userBatch = userIds.slice(i, Math.min(i + batchSize, userIds.length));
        const batch = [];

        for (const userId of userBatch) {
            const numPlans = Math.floor(Math.random() * plansPerUser) + 1;

            for (let j = 0; j < numPlans; j++) {
                const countryId = countryIds[Math.floor(Math.random() * countryIds.length)];
                const purpose = purposes[Math.floor(Math.random() * purposes.length)];

                // Generate random future dates
                const departureDate = new Date();
                departureDate.setDate(departureDate.getDate() + Math.floor(Math.random() * 180)); // 0-180 days

                const returnDate = new Date(departureDate);
                returnDate.setDate(returnDate.getDate() + Math.floor(Math.random() * 21) + 1); // 1-21 days

                batch.push([
                    userId,
                    countryId,
                    departureDate.toISOString().split('T')[0],
                    returnDate.toISOString().split('T')[0],
                    purpose
                ]);
            }
        }

        try {
            if (batch.length > 0) {
                const placeholders = batch.map((_, index) => {
                    const base = index * 5;
                    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
                }).join(', ');

                const values = batch.flat();

                await query(`
                    INSERT INTO travel_plans (user_id, destination_country_id, departure_date, return_date, purpose)
                    VALUES ${placeholders}
                `, values);

                travelPlans.push(...batch);
            }
        } catch (error) {
            logger.error('Error inserting travel plans batch:', error);
        }

        if (i % 1000 === 0) {
            logger.info(`Generated travel plans for ${Math.min(i + batchSize, userIds.length)}/${userIds.length} users`);
        }
    }

    logger.info(`Generated ${travelPlans.length} travel plans`);
    return travelPlans;
}

/**
 * Generate and queue multiple alerts for load testing
 * @param {number} alertCount - Number of alerts to generate
 */
async function generateAndQueueAlerts(alertCount) {
    logger.info(`Generating ${alertCount} alerts and queuing for processing...`);

    // Get available countries
    const countriesResult = await query('SELECT id FROM countries');
    const countryIds = countriesResult.rows.map(row => row.id);

    const startTime = Date.now();
    const queuedAlerts = [];

    for (let i = 0; i < alertCount; i++) {
        const countryId = countryIds[Math.floor(Math.random() * countryIds.length)];
        const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        const severity = severities[Math.floor(Math.random() * severities.length)];

        try {
            // Create alert in database
            const alertResult = await query(`
                INSERT INTO alerts (title, message, severity, alert_type, country_id, created_by)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `, [
                `Load Test Alert ${i + 1}: ${faker.lorem.sentence(4)}`,
                faker.lorem.paragraph(2),
                severity,
                alertType,
                countryId,
                'load-test'
            ]);

            const newAlert = alertResult.rows[0];

            // Find affected users for this country
            const affectedUsersResult = await query(`
                SELECT DISTINCT u.id, u.email, u.first_name, u.phone,
                       u.sms_enabled, u.push_enabled, u.email_enabled
                FROM users u
                JOIN travel_plans tp ON u.id = tp.user_id
                WHERE tp.is_active = true
                    AND tp.destination_country_id = $1
                    AND tp.departure_date <= CURRENT_DATE + INTERVAL '30 days'
                    AND (tp.return_date IS NULL OR tp.return_date >= CURRENT_DATE)
                LIMIT 100
            `, [countryId]);

            const affectedUsers = affectedUsersResult.rows;

            if (affectedUsers.length > 0) {
                // Queue the alert for processing
                await queueAlert(newAlert, affectedUsers);
                queuedAlerts.push({
                    alertId: newAlert.id,
                    affectedUsers: affectedUsers.length
                });
            }

            // Show progress every 100 alerts
            if ((i + 1) % 100 === 0) {
                const elapsed = (Date.now() - startTime) / 1000;
                const rate = (i + 1) / elapsed;
                logger.info(`Queued ${i + 1}/${alertCount} alerts (${rate.toFixed(2)} alerts/sec)`);
            }

        } catch (error) {
            logger.error(`Error creating/queuing alert ${i + 1}:`, error);
        }
    }

    const totalTime = (Date.now() - startTime) / 1000;
    const totalAffectedUsers = queuedAlerts.reduce((sum, alert) => sum + alert.affectedUsers, 0);

    logger.info(`Load test completed in ${totalTime.toFixed(2)} seconds`);
    logger.info(`Queued ${queuedAlerts.length} alerts affecting ${totalAffectedUsers} total user notifications`);

    return queuedAlerts;
}

/**
 * Monitor queue processing progress
 */
async function monitorQueueProgress() {
    logger.info('Monitoring queue progress...');

    const Redis = require('ioredis');
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

    let lastStats = { waiting: 0, active: 0, completed: 0, failed: 0 };

    const monitor = setInterval(async () => {
        try {
            const alertQueue = require('bullmq').Queue;
            const queue = new alertQueue('alerts', { connection: redis });

            const waiting = await queue.getWaiting();
            const active = await queue.getActive();
            const completed = await queue.getCompleted();
            const failed = await queue.getFailed();

            const stats = {
                waiting: waiting.length,
                active: active.length,
                completed: completed.length,
                failed: failed.length
            };

            // Show progress if there are changes
            if (JSON.stringify(stats) !== JSON.stringify(lastStats)) {
                logger.info(`Queue Status - Waiting: ${stats.waiting}, Active: ${stats.active}, Completed: ${stats.completed}, Failed: ${stats.failed}`);
                lastStats = stats;
            }

            // Stop monitoring if queue is empty and no active jobs
            if (stats.waiting === 0 && stats.active === 0) {
                logger.info('Queue processing completed');
                clearInterval(monitor);
                redis.disconnect();
            }

        } catch (error) {
            logger.error('Error monitoring queue:', error);
        }
    }, 5000); // Check every 5 seconds

    // Stop monitoring after 10 minutes maximum
    setTimeout(() => {
        clearInterval(monitor);
        redis.disconnect();
        logger.info('Queue monitoring stopped (timeout)');
    }, 600000);
}

/**
 * Run comprehensive load test
 * @param {Object} options - Load test configuration
 */
async function runLoadTest(options = {}) {
    const config = {
        users: 1000,
        alerts: 100,
        plansPerUser: 2,
        skipUserGeneration: false,
        monitorQueue: true,
        ...options
    };

    logger.info('Starting comprehensive load test with configuration:', config);
    const startTime = Date.now();

    try {
        let userIds = [];

        if (!config.skipUserGeneration) {
            // Generate fake users
            userIds = await generateFakeUsers(config.users);

            // Generate travel plans
            await generateTravelPlans(userIds, config.plansPerUser);
        } else {
            // Use existing users
            const existingUsers = await query('SELECT id FROM users LIMIT $1', [config.users]);
            userIds = existingUsers.rows.map(row => row.id);
            logger.info(`Using ${userIds.length} existing users`);
        }

        // Generate and queue alerts
        const queuedAlerts = await generateAndQueueAlerts(config.alerts);

        // Monitor queue processing
        if (config.monitorQueue) {
            setTimeout(() => monitorQueueProgress(), 1000);
        }

        // Final statistics
        const totalTime = (Date.now() - startTime) / 1000;
        logger.info(`Load test setup completed in ${totalTime.toFixed(2)} seconds`);

        const stats = await query(`
            SELECT
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM travel_plans WHERE is_active = true) as active_travel_plans,
                (SELECT COUNT(*) FROM alerts WHERE created_by = 'load-test') as load_test_alerts,
                (SELECT COUNT(*) FROM user_notifications WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '1 hour') as recent_notifications
        `);

        logger.info('Current database statistics:', stats.rows[0]);

        return {
            success: true,
            duration: totalTime,
            queuedAlerts: queuedAlerts.length,
            statistics: stats.rows[0]
        };

    } catch (error) {
        logger.error('Load test failed:', error);
        throw error;
    }
}

// Command line interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};

    // Parse command line arguments
    for (let i = 0; i < args.length; i += 2) {
        const key = args[i].replace('--', '');
        const value = args[i + 1];

        if (key === 'users' || key === 'alerts' || key === 'plansPerUser') {
            options[key] = parseInt(value);
        } else if (key === 'skipUserGeneration' || key === 'monitorQueue') {
            options[key] = value === 'true';
        }
    }

    runLoadTest(options)
        .then((result) => {
            logger.info('Load test completed successfully:', result);
            process.exit(0);
        })
        .catch((error) => {
            logger.error('Load test failed:', error);
            process.exit(1);
        });
}

module.exports = {
    generateFakeUsers,
    generateTravelPlans,
    generateAndQueueAlerts,
    monitorQueueProgress,
    runLoadTest
};