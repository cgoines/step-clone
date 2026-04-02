const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const logger = require('../utils/logger');
const { authenticateToken } = require('../middleware/auth');
const { sendNotification } = require('../services/pushNotificationService');
const { sendSMS } = require('../services/smsService');
const { sendEmail } = require('../services/emailService');

const router = express.Router();

/**
 * Get notification statistics for admin (all notifications)
 * GET /api/notifications/admin/stats
 */
router.get('/admin/stats', authenticateToken, async (req, res) => {
    try {
        const { period = '30d' } = req.query;

        let dateFilter = '';
        if (period === '7d') {
            dateFilter = "AND un.created_at >= CURRENT_DATE - INTERVAL '7 days'";
        } else if (period === '30d') {
            dateFilter = "AND un.created_at >= CURRENT_DATE - INTERVAL '30 days'";
        } else if (period === '90d') {
            dateFilter = "AND un.created_at >= CURRENT_DATE - INTERVAL '90 days'";
        }

        // Overall stats
        const overallResult = await query(`
            SELECT
                COUNT(*) as total_notifications,
                COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
                COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
                COUNT(*) FILTER (WHERE status = 'delivered') as delivered_count
            FROM user_notifications un
            WHERE 1=1 ${dateFilter}
        `);

        // Daily stats for chart
        const dailyResult = await query(`
            SELECT
                DATE(un.created_at) as date,
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'sent') as sent,
                COUNT(*) FILTER (WHERE status = 'failed') as failed,
                COUNT(*) FILTER (WHERE status = 'delivered') as delivered
            FROM user_notifications un
            WHERE un.created_at >= CURRENT_DATE - INTERVAL '${period === '7d' ? '7' : period === '30d' ? '30' : '90'} days'
            GROUP BY DATE(un.created_at)
            ORDER BY date DESC
        `);

        // By channel
        const channelResult = await query(`
            SELECT
                channel,
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'sent') as sent,
                COUNT(*) FILTER (WHERE status = 'failed') as failed
            FROM user_notifications un
            WHERE 1=1 ${dateFilter}
            GROUP BY channel
            ORDER BY total DESC
        `);

        res.json({
            period,
            overall: overallResult.rows[0],
            daily: dailyResult.rows,
            byChannel: channelResult.rows
        });

    } catch (error) {
        logger.error('Error fetching admin notification statistics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get all notifications (admin view)
 * GET /api/notifications/admin
 */
router.get('/admin', authenticateToken, async (req, res) => {
    try {
        const {
            channel,
            status,
            alertType,
            limit = 100,
            offset = 0,
            startDate,
            endDate
        } = req.query;

        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramCount = 0;

        // Filter by channel (sms, push, email)
        if (channel) {
            paramCount++;
            whereClause += ` AND un.channel = $${paramCount}`;
            params.push(channel);
        }

        // Filter by status (pending, sent, failed, delivered)
        if (status) {
            paramCount++;
            whereClause += ` AND un.status = $${paramCount}`;
            params.push(status);
        }

        // Filter by alert type
        if (alertType) {
            paramCount++;
            whereClause += ` AND a.alert_type = $${paramCount}`;
            params.push(alertType);
        }

        // Date range filter
        if (startDate) {
            paramCount++;
            whereClause += ` AND un.created_at >= $${paramCount}`;
            params.push(startDate);
        }

        if (endDate) {
            paramCount++;
            whereClause += ` AND un.created_at <= $${paramCount}`;
            params.push(endDate);
        }

        const result = await query(`
            SELECT un.id, un.channel, un.status, un.sent_at, un.delivered_at,
                   un.error_message, un.created_at,
                   a.id as alert_id, a.title, a.message, a.severity, a.alert_type,
                   c.name as country_name, c.code as country_code,
                   u.first_name, u.last_name, u.email
            FROM user_notifications un
            JOIN alerts a ON un.alert_id = a.id
            JOIN users u ON un.user_id = u.id
            LEFT JOIN countries c ON a.country_id = c.id
            ${whereClause}
            ORDER BY un.created_at DESC
            LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `, [...params, parseInt(limit), parseInt(offset)]);

        // Get total count
        const countResult = await query(`
            SELECT COUNT(*) as total
            FROM user_notifications un
            JOIN alerts a ON un.alert_id = a.id
            JOIN users u ON un.user_id = u.id
            ${whereClause}
        `, params);

        const notifications = result.rows.map(row => ({
            id: row.id,
            channel: row.channel,
            status: row.status,
            title: row.title,
            message: row.message,
            sentAt: row.sent_at,
            deliveredAt: row.delivered_at,
            errorMessage: row.error_message,
            createdAt: row.created_at,
            user: {
                firstName: row.first_name,
                lastName: row.last_name,
                email: row.email
            },
            alert: {
                id: row.alert_id,
                title: row.title,
                message: row.message,
                severity: row.severity,
                type: row.alert_type,
                country: row.country_name ? {
                    name: row.country_name,
                    code: row.country_code
                } : null
            }
        }));

        res.json({
            notifications,
            pagination: {
                total: parseInt(countResult.rows[0].total),
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: parseInt(offset) + result.rows.length < parseInt(countResult.rows[0].total)
            }
        });

    } catch (error) {
        logger.error('Error fetching admin notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get user's notifications history
 * GET /api/notifications
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const {
            channel,
            status,
            alertType,
            limit = 20,
            offset = 0,
            startDate,
            endDate
        } = req.query;

        let whereClause = 'WHERE un.user_id = $1';
        const params = [req.user.id];
        let paramCount = 1;

        // Filter by channel (sms, push, email)
        if (channel) {
            paramCount++;
            whereClause += ` AND un.channel = $${paramCount}`;
            params.push(channel);
        }

        // Filter by status (pending, sent, failed, delivered)
        if (status) {
            paramCount++;
            whereClause += ` AND un.status = $${paramCount}`;
            params.push(status);
        }

        // Filter by alert type
        if (alertType) {
            paramCount++;
            whereClause += ` AND a.alert_type = $${paramCount}`;
            params.push(alertType);
        }

        // Date range filter
        if (startDate) {
            paramCount++;
            whereClause += ` AND un.created_at >= $${paramCount}`;
            params.push(startDate);
        }

        if (endDate) {
            paramCount++;
            whereClause += ` AND un.created_at <= $${paramCount}`;
            params.push(endDate);
        }

        const result = await query(`
            SELECT un.id, un.channel, un.status, un.sent_at, un.delivered_at,
                   un.error_message, un.created_at,
                   a.id as alert_id, a.title as alert_title, a.message as alert_message,
                   a.severity, a.alert_type,
                   c.name as country_name, c.code as country_code
            FROM user_notifications un
            JOIN alerts a ON un.alert_id = a.id
            LEFT JOIN countries c ON a.country_id = c.id
            ${whereClause}
            ORDER BY un.created_at DESC
            LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `, [...params, parseInt(limit), parseInt(offset)]);

        // Get total count
        const countResult = await query(`
            SELECT COUNT(*) as total
            FROM user_notifications un
            JOIN alerts a ON un.alert_id = a.id
            ${whereClause}
        `, params);

        const notifications = result.rows.map(row => ({
            id: row.id,
            channel: row.channel,
            status: row.status,
            sentAt: row.sent_at,
            deliveredAt: row.delivered_at,
            errorMessage: row.error_message,
            createdAt: row.created_at,
            alert: {
                id: row.alert_id,
                title: row.alert_title,
                message: row.alert_message,
                severity: row.severity,
                type: row.alert_type,
                country: row.country_name ? {
                    name: row.country_name,
                    code: row.country_code
                } : null
            }
        }));

        res.json({
            notifications,
            pagination: {
                total: parseInt(countResult.rows[0].total),
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: parseInt(offset) + result.rows.length < parseInt(countResult.rows[0].total)
            }
        });

    } catch (error) {
        logger.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get notification statistics for user
 * GET /api/notifications/stats
 */
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const { period = '30d' } = req.query;

        let dateFilter = '';
        if (period === '7d') {
            dateFilter = "AND un.created_at >= CURRENT_DATE - INTERVAL '7 days'";
        } else if (period === '30d') {
            dateFilter = "AND un.created_at >= CURRENT_DATE - INTERVAL '30 days'";
        } else if (period === '90d') {
            dateFilter = "AND un.created_at >= CURRENT_DATE - INTERVAL '90 days'";
        }

        // Overall stats
        const overallResult = await query(`
            SELECT
                COUNT(*) as total_notifications,
                COUNT(*) FILTER (WHERE status = 'sent') as sent_count,
                COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
                COUNT(*) FILTER (WHERE status = 'delivered') as delivered_count
            FROM user_notifications un
            WHERE user_id = $1 ${dateFilter}
        `, [req.user.id]);

        // By channel
        const channelResult = await query(`
            SELECT
                channel,
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'sent') as sent,
                COUNT(*) FILTER (WHERE status = 'failed') as failed
            FROM user_notifications un
            WHERE user_id = $1 ${dateFilter}
            GROUP BY channel
            ORDER BY total DESC
        `, [req.user.id]);

        // By alert type
        const typeResult = await query(`
            SELECT
                a.alert_type,
                COUNT(*) as count
            FROM user_notifications un
            JOIN alerts a ON un.alert_id = a.id
            WHERE un.user_id = $1 ${dateFilter}
            GROUP BY a.alert_type
            ORDER BY count DESC
        `, [req.user.id]);

        // By severity
        const severityResult = await query(`
            SELECT
                a.severity,
                COUNT(*) as count
            FROM user_notifications un
            JOIN alerts a ON un.alert_id = a.id
            WHERE un.user_id = $1 ${dateFilter}
            GROUP BY a.severity
            ORDER BY
                CASE a.severity
                    WHEN 'emergency' THEN 1
                    WHEN 'critical' THEN 2
                    WHEN 'warning' THEN 3
                    WHEN 'info' THEN 4
                END
        `, [req.user.id]);

        res.json({
            period,
            overall: overallResult.rows[0],
            byChannel: channelResult.rows,
            byAlertType: typeResult.rows,
            bySeverity: severityResult.rows
        });

    } catch (error) {
        logger.error('Error fetching notification statistics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Send test notification
 * POST /api/notifications/test
 */
router.post('/test', [
    authenticateToken,
    body('channel').isIn(['sms', 'push', 'email']),
    body('message').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { channel, message = 'This is a test notification from STEP Clone.' } = req.body;

        // Get user details
        const userResult = await query(`
            SELECT email, phone, sms_enabled, push_enabled, email_enabled
            FROM users
            WHERE id = $1
        `, [req.user.id]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];

        try {
            let result;
            switch (channel) {
                case 'sms':
                    if (!user.sms_enabled) {
                        return res.status(400).json({ error: 'SMS notifications are disabled' });
                    }
                    if (!user.phone) {
                        return res.status(400).json({ error: 'No phone number registered' });
                    }
                    result = await sendSMS(user.phone, message);
                    break;

                case 'push':
                    if (!user.push_enabled) {
                        return res.status(400).json({ error: 'Push notifications are disabled' });
                    }
                    result = await sendNotification(req.user.id, 'Test Notification', message, 'info');
                    if (result.length === 0) {
                        return res.status(400).json({ error: 'No registered devices for push notifications' });
                    }
                    break;

                case 'email':
                    if (!user.email_enabled) {
                        return res.status(400).json({ error: 'Email notifications are disabled' });
                    }
                    result = await sendEmail(user.email, 'Test Notification from STEP Clone', message);
                    break;

                default:
                    return res.status(400).json({ error: 'Invalid channel' });
            }

            logger.info(`Test notification sent via ${channel} to user ${req.user.id}`);

            res.json({
                message: `Test ${channel} notification sent successfully`,
                result: result
            });

        } catch (sendError) {
            logger.error(`Failed to send test ${channel} notification:`, sendError);
            res.status(500).json({
                error: `Failed to send ${channel} notification`,
                details: sendError.message
            });
        }

    } catch (error) {
        logger.error('Error sending test notification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Mark notifications as read/acknowledged
 * POST /api/notifications/acknowledge
 */
router.post('/acknowledge', [
    authenticateToken,
    body('notificationIds').isArray().withMessage('Notification IDs must be an array'),
    body('notificationIds.*').isUUID().withMessage('Each notification ID must be a valid UUID')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { notificationIds } = req.body;

        if (notificationIds.length === 0) {
            return res.status(400).json({ error: 'No notification IDs provided' });
        }

        // Create placeholder string for IN clause
        const placeholders = notificationIds.map((_, index) => `$${index + 2}`).join(',');

        const result = await query(`
            UPDATE user_notifications
            SET delivered_at = CURRENT_TIMESTAMP
            WHERE user_id = $1
                AND id IN (${placeholders})
                AND delivered_at IS NULL
            RETURNING id
        `, [req.user.id, ...notificationIds]);

        logger.info(`${result.rows.length} notifications acknowledged for user ${req.user.id}`);

        res.json({
            message: `${result.rows.length} notifications acknowledged`,
            acknowledgedIds: result.rows.map(row => row.id)
        });

    } catch (error) {
        logger.error('Error acknowledging notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
router.get('/unread-count', authenticateToken, async (req, res) => {
    try {
        const result = await query(`
            SELECT COUNT(*) as unread_count
            FROM user_notifications
            WHERE user_id = $1
                AND delivered_at IS NULL
                AND status IN ('sent', 'pending')
        `, [req.user.id]);

        res.json({
            unreadCount: parseInt(result.rows[0].unread_count)
        });

    } catch (error) {
        logger.error('Error fetching unread count:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get recent notifications (for dashboard/widget)
 * GET /api/notifications/recent
 */
router.get('/recent', authenticateToken, async (req, res) => {
    try {
        const { limit = 5 } = req.query;

        const result = await query(`
            SELECT un.id, un.channel, un.status, un.created_at,
                   a.title as alert_title, a.severity, a.alert_type,
                   c.name as country_name
            FROM user_notifications un
            JOIN alerts a ON un.alert_id = a.id
            LEFT JOIN countries c ON a.country_id = c.id
            WHERE un.user_id = $1
            ORDER BY un.created_at DESC
            LIMIT $2
        `, [req.user.id, parseInt(limit)]);

        const notifications = result.rows.map(row => ({
            id: row.id,
            channel: row.channel,
            status: row.status,
            createdAt: row.created_at,
            alert: {
                title: row.alert_title,
                severity: row.severity,
                type: row.alert_type,
                country: row.country_name
            }
        }));

        res.json({ notifications });

    } catch (error) {
        logger.error('Error fetching recent notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Send custom notification (admin only)
 * POST /api/notifications/send
 */
router.post('/send', [
    authenticateToken,
    body('userIds').optional().isArray().withMessage('User IDs must be an array'),
    body('userIds.*').optional().isUUID().withMessage('Each user ID must be a valid UUID'),
    body('recipients').optional().isIn(['all', 'active', 'country']).withMessage('Recipients must be: all, active, or country'),
    body('countryId').optional().isUUID().withMessage('Country ID must be a valid UUID'),
    body('channels').isArray().withMessage('Channels must be an array').custom((channels) => {
        const validChannels = ['email', 'sms', 'push'];
        return channels.every(channel => validChannels.includes(channel));
    }),
    body('title').isLength({ min: 1, max: 200 }).withMessage('Title must be 1-200 characters'),
    body('message').isLength({ min: 1, max: 1000 }).withMessage('Message must be 1-1000 characters'),
    body('severity').optional().isIn(['info', 'warning', 'critical', 'emergency']).withMessage('Invalid severity level')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const {
            userIds,
            recipients = 'all',
            countryId,
            channels,
            title,
            message,
            severity = 'info'
        } = req.body;

        // Build user query based on recipients
        let userQuery = '';
        let userParams = [];

        if (userIds && userIds.length > 0) {
            // Send to specific users
            const placeholders = userIds.map((_, index) => `$${index + 1}`).join(',');
            userQuery = `SELECT id, email, phone, sms_enabled, push_enabled, email_enabled, first_name, last_name
                        FROM users
                        WHERE id IN (${placeholders}) AND is_verified = true`;
            userParams = userIds;
        } else if (recipients === 'country' && countryId) {
            // Send to users with travel plans to specific country
            userQuery = `SELECT DISTINCT u.id, u.email, u.phone, u.sms_enabled, u.push_enabled, u.email_enabled, u.first_name, u.last_name
                        FROM users u
                        JOIN travel_plans tp ON u.id = tp.user_id
                        WHERE tp.destination_country_id = $1
                        AND tp.is_active = true
                        AND u.is_verified = true
                        AND (tp.departure_date >= CURRENT_DATE OR tp.return_date >= CURRENT_DATE)`;
            userParams = [countryId];
        } else if (recipients === 'active') {
            // Send to users with active travel plans
            userQuery = `SELECT DISTINCT u.id, u.email, u.phone, u.sms_enabled, u.push_enabled, u.email_enabled, u.first_name, u.last_name
                        FROM users u
                        JOIN travel_plans tp ON u.id = tp.user_id
                        WHERE tp.is_active = true
                        AND u.is_verified = true
                        AND (tp.departure_date >= CURRENT_DATE OR tp.return_date >= CURRENT_DATE)`;
        } else {
            // Send to all verified users
            userQuery = `SELECT id, email, phone, sms_enabled, push_enabled, email_enabled, first_name, last_name
                        FROM users
                        WHERE is_verified = true`;
        }

        const usersResult = await query(userQuery, userParams);
        const users = usersResult.rows;

        if (users.length === 0) {
            return res.status(400).json({ error: 'No eligible users found for notification' });
        }

        // Create a custom alert record for this notification
        const alertResult = await query(`
            INSERT INTO alerts (title, message, severity, alert_type, created_by, is_active)
            VALUES ($1, $2, $3, 'custom', $4, true)
            RETURNING id
        `, [title, message, severity, req.user.email]);

        const alertId = alertResult.rows[0].id;

        let notificationsSent = 0;
        let notificationsFailed = 0;
        const results = { email: [], sms: [], push: [] };

        // Send notifications to each user via each selected channel
        for (const user of users) {
            for (const channel of channels) {
                // Check if user has this channel enabled
                const channelEnabled = user[`${channel}_enabled`];

                if (!channelEnabled) {
                    notificationsFailed++;
                    continue;
                }

                try {
                    // Insert notification record
                    const notificationResult = await query(`
                        INSERT INTO user_notifications (user_id, alert_id, channel, status)
                        VALUES ($1, $2, $3, 'pending')
                        RETURNING id
                    `, [user.id, alertId, channel]);

                    const notificationId = notificationResult.rows[0].id;

                    // Send via appropriate service
                    let sendResult;
                    switch (channel) {
                        case 'email':
                            if (!user.email) throw new Error('No email address');
                            sendResult = await sendEmail(user.email, `STEP Clone: ${title}`, `${title}\n\n${message}`);
                            break;
                        case 'sms':
                            if (!user.phone) throw new Error('No phone number');
                            sendResult = await sendSMS(user.phone, `${title}: ${message}`);
                            break;
                        case 'push':
                            sendResult = await sendNotification(user.id, title, message, severity);
                            if (sendResult.length === 0) throw new Error('No registered devices');
                            break;
                    }

                    // Update notification as sent
                    await query(`
                        UPDATE user_notifications
                        SET status = 'sent', sent_at = CURRENT_TIMESTAMP
                        WHERE id = $1
                    `, [notificationId]);

                    notificationsSent++;
                    results[channel].push({
                        userId: user.id,
                        email: user.email,
                        name: `${user.first_name} ${user.last_name}`,
                        status: 'sent'
                    });

                } catch (sendError) {
                    // Update notification with error
                    await query(`
                        UPDATE user_notifications
                        SET status = 'failed', error_message = $1
                        WHERE user_id = $2 AND alert_id = $3 AND channel = $4
                    `, [sendError.message, user.id, alertId, channel]);

                    notificationsFailed++;
                    results[channel].push({
                        userId: user.id,
                        email: user.email,
                        name: `${user.first_name} ${user.last_name}`,
                        status: 'failed',
                        error: sendError.message
                    });

                    logger.error(`Failed to send ${channel} notification to user ${user.id}:`, sendError);
                }
            }
        }

        logger.info(`Custom notification sent by ${req.user.email}: ${notificationsSent} sent, ${notificationsFailed} failed`);

        res.json({
            message: `Notification sent successfully`,
            alertId: alertId,
            recipients: users.length,
            channels: channels,
            sent: notificationsSent,
            failed: notificationsFailed,
            results: results
        });

    } catch (error) {
        logger.error('Error sending custom notification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Resend failed notification
 * POST /api/notifications/:id/resend
 */
router.post('/:id/resend', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Get notification details
        const notificationResult = await query(`
            SELECT un.*, a.title, a.message, a.severity
            FROM user_notifications un
            JOIN alerts a ON un.alert_id = a.id
            WHERE un.id = $1 AND un.user_id = $2 AND un.status = 'failed'
        `, [id, req.user.id]);

        if (notificationResult.rows.length === 0) {
            return res.status(404).json({ error: 'Failed notification not found' });
        }

        const notification = notificationResult.rows[0];

        // Get user details
        const userResult = await query(`
            SELECT email, phone, sms_enabled, push_enabled, email_enabled
            FROM users
            WHERE id = $1
        `, [req.user.id]);

        const user = userResult.rows[0];

        try {
            let result;
            const alertMessage = `${notification.title}: ${notification.message}`;

            switch (notification.channel) {
                case 'sms':
                    if (!user.sms_enabled || !user.phone) {
                        return res.status(400).json({ error: 'SMS not available for this user' });
                    }
                    result = await sendSMS(user.phone, alertMessage);
                    break;

                case 'push':
                    if (!user.push_enabled) {
                        return res.status(400).json({ error: 'Push notifications disabled' });
                    }
                    result = await sendNotification(req.user.id, notification.title, notification.message, notification.severity);
                    break;

                case 'email':
                    if (!user.email_enabled) {
                        return res.status(400).json({ error: 'Email notifications disabled' });
                    }
                    result = await sendEmail(user.email, `Travel Alert: ${notification.title}`, alertMessage);
                    break;

                default:
                    return res.status(400).json({ error: 'Invalid notification channel' });
            }

            // Update notification status
            await query(`
                UPDATE user_notifications
                SET status = 'sent', sent_at = CURRENT_TIMESTAMP, error_message = NULL
                WHERE id = $1
            `, [id]);

            logger.info(`Notification resent successfully: ${id} via ${notification.channel}`);

            res.json({
                message: 'Notification resent successfully',
                channel: notification.channel
            });

        } catch (sendError) {
            // Update error message
            await query(`
                UPDATE user_notifications
                SET error_message = $1
                WHERE id = $2
            `, [sendError.message, id]);

            logger.error(`Failed to resend notification ${id}:`, sendError);
            res.status(500).json({
                error: 'Failed to resend notification',
                details: sendError.message
            });
        }

    } catch (error) {
        logger.error('Error resending notification:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;