const admin = require('firebase-admin');
const logger = require('../utils/logger');
const { query } = require('../config/database');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    try {
        const serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        };

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID
        });

        logger.info('Firebase Admin SDK initialized');
    } catch (error) {
        logger.error('Failed to initialize Firebase:', error);
    }
}

/**
 * Send push notification to a specific user
 * @param {string} userId - User ID
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {string} severity - Alert severity (info, warning, critical, emergency)
 * @param {object} data - Additional data payload
 * @returns {Promise<Array>} - Array of send results
 */
const sendNotification = async (userId, title, body, severity = 'info', data = {}) => {
    try {
        // Get user's device tokens
        const tokenResult = await query(`
            SELECT token, platform
            FROM device_tokens
            WHERE user_id = $1 AND is_active = true
        `, [userId]);

        if (tokenResult.rows.length === 0) {
            logger.warn(`No active device tokens found for user ${userId}`);
            return [];
        }

        const tokens = tokenResult.rows.map(row => row.token);

        // Create notification payload
        const message = {
            notification: {
                title,
                body
            },
            data: {
                severity,
                userId,
                timestamp: new Date().toISOString(),
                ...data
            },
            tokens
        };

        // Add platform-specific configurations
        message.android = {
            priority: severity === 'emergency' || severity === 'critical' ? 'high' : 'normal',
            notification: {
                sound: 'default',
                channelId: 'travel_alerts',
                priority: severity === 'emergency' || severity === 'critical' ? 'high' : 'default'
            }
        };

        message.apns = {
            payload: {
                aps: {
                    alert: {
                        title,
                        body
                    },
                    sound: 'default',
                    badge: 1
                }
            }
        };

        // Send multicast message
        logger.info(`Sending push notification to ${tokens.length} devices for user ${userId}`);
        const response = await admin.messaging().sendMulticast(message);

        // Process results
        const results = [];
        response.responses.forEach((result, index) => {
            const token = tokens[index];
            if (result.success) {
                logger.info(`Push notification sent successfully to token ${token.substring(0, 20)}...`);
                results.push({ token, success: true, messageId: result.messageId });
            } else {
                logger.error(`Failed to send push notification to token ${token.substring(0, 20)}...`, result.error);
                results.push({ token, success: false, error: result.error });

                // Handle invalid tokens
                if (result.error?.code === 'messaging/invalid-registration-token' ||
                    result.error?.code === 'messaging/registration-token-not-registered') {
                    deactivateDeviceToken(token).catch(err =>
                        logger.error('Failed to deactivate invalid token:', err)
                    );
                }
            }
        });

        logger.info(`Push notification batch completed: ${response.successCount} sent, ${response.failureCount} failed`);
        return results;

    } catch (error) {
        logger.error(`Failed to send push notification to user ${userId}:`, error);
        throw error;
    }
};

/**
 * Send push notification to multiple users
 * @param {Array} userIds - Array of user IDs
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {string} severity - Alert severity
 * @param {object} data - Additional data payload
 * @returns {Promise<Array>} - Array of all results
 */
const sendBulkNotification = async (userIds, title, body, severity = 'info', data = {}) => {
    const allResults = [];
    const batchSize = 500; // Firebase FCM limit

    try {
        for (let i = 0; i < userIds.length; i += batchSize) {
            const batch = userIds.slice(i, i + batchSize);
            const batchPromises = batch.map(userId =>
                sendNotification(userId, title, body, severity, data)
                    .catch(error => ({
                        userId,
                        error: error.message,
                        success: false
                    }))
            );

            const batchResults = await Promise.all(batchPromises);
            allResults.push(...batchResults.flat());

            // Small delay between batches
            if (i + batchSize < userIds.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        logger.info(`Bulk push notification completed: ${allResults.length} total operations`);
        return allResults;

    } catch (error) {
        logger.error('Failed to send bulk push notifications:', error);
        throw error;
    }
};

/**
 * Register a device token for a user
 * @param {string} userId - User ID
 * @param {string} token - Device token
 * @param {string} platform - Platform (ios, android, web)
 * @returns {Promise<object>} - Database result
 */
const registerDeviceToken = async (userId, token, platform) => {
    try {
        // Check if token already exists
        const existingToken = await query(`
            SELECT id FROM device_tokens
            WHERE user_id = $1 AND token = $2
        `, [userId, token]);

        if (existingToken.rows.length > 0) {
            // Update existing token to active
            const result = await query(`
                UPDATE device_tokens
                SET is_active = true, platform = $3, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $1 AND token = $2
                RETURNING *
            `, [userId, token, platform]);

            logger.info(`Device token updated for user ${userId}`);
            return result.rows[0];
        } else {
            // Insert new token
            const result = await query(`
                INSERT INTO device_tokens (user_id, token, platform)
                VALUES ($1, $2, $3)
                RETURNING *
            `, [userId, token, platform]);

            logger.info(`New device token registered for user ${userId}`);
            return result.rows[0];
        }
    } catch (error) {
        logger.error('Failed to register device token:', error);
        throw error;
    }
};

/**
 * Deactivate a device token
 * @param {string} token - Device token to deactivate
 * @returns {Promise<void>}
 */
const deactivateDeviceToken = async (token) => {
    try {
        await query(`
            UPDATE device_tokens
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE token = $1
        `, [token]);

        logger.info(`Device token deactivated: ${token.substring(0, 20)}...`);
    } catch (error) {
        logger.error('Failed to deactivate device token:', error);
        throw error;
    }
};

/**
 * Get active device tokens for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - Array of device tokens
 */
const getUserDeviceTokens = async (userId) => {
    try {
        const result = await query(`
            SELECT token, platform, created_at
            FROM device_tokens
            WHERE user_id = $1 AND is_active = true
            ORDER BY created_at DESC
        `, [userId]);

        return result.rows;
    } catch (error) {
        logger.error('Failed to get user device tokens:', error);
        throw error;
    }
};

/**
 * Send topic-based notification (for broadcasting)
 * @param {string} topic - Topic name
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data payload
 * @returns {Promise<string>} - Message ID
 */
const sendTopicNotification = async (topic, title, body, data = {}) => {
    try {
        const message = {
            topic,
            notification: {
                title,
                body
            },
            data: {
                timestamp: new Date().toISOString(),
                ...data
            }
        };

        const messageId = await admin.messaging().send(message);
        logger.info(`Topic notification sent to ${topic}: ${messageId}`);
        return messageId;
    } catch (error) {
        logger.error(`Failed to send topic notification to ${topic}:`, error);
        throw error;
    }
};

module.exports = {
    sendNotification,
    sendBulkNotification,
    registerDeviceToken,
    deactivateDeviceToken,
    getUserDeviceTokens,
    sendTopicNotification
};