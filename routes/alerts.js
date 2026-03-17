const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const logger = require('../utils/logger');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { queueAlert } = require('../services/queueService');

const router = express.Router();

/**
 * Get public alerts (no authentication required)
 * GET /api/alerts
 */
router.get('/', optionalAuth, async (req, res) => {
    try {
        const {
            countryId,
            severity,
            alertType,
            limit = 20,
            offset = 0,
            active = 'true'
        } = req.query;

        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramCount = 0;

        // Filter by active status
        if (active === 'true') {
            whereClause += ' AND a.is_active = true AND (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP)';
        } else if (active === 'false') {
            whereClause += ' AND (a.is_active = false OR a.expires_at <= CURRENT_TIMESTAMP)';
        }

        // Filter by country
        if (countryId) {
            paramCount++;
            whereClause += ` AND a.country_id = $${paramCount}`;
            params.push(parseInt(countryId));
        }

        // Filter by severity
        if (severity) {
            paramCount++;
            whereClause += ` AND a.severity = $${paramCount}`;
            params.push(severity);
        }

        // Filter by alert type
        if (alertType) {
            paramCount++;
            whereClause += ` AND a.alert_type = $${paramCount}`;
            params.push(alertType);
        }

        const result = await query(`
            SELECT a.id, a.title, a.message, a.severity, a.alert_type,
                   a.region, a.latitude, a.longitude, a.radius_km,
                   a.is_active, a.expires_at, a.created_at, a.updated_at,
                   c.name as country_name, c.code as country_code
            FROM alerts a
            LEFT JOIN countries c ON a.country_id = c.id
            ${whereClause}
            ORDER BY
                CASE a.severity
                    WHEN 'emergency' THEN 1
                    WHEN 'critical' THEN 2
                    WHEN 'warning' THEN 3
                    WHEN 'info' THEN 4
                END,
                a.created_at DESC
            LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `, [...params, parseInt(limit), parseInt(offset)]);

        // Get total count
        const countResult = await query(`
            SELECT COUNT(*) as total FROM alerts a ${whereClause}
        `, params);

        const alerts = result.rows.map(row => ({
            id: row.id,
            title: row.title,
            message: row.message,
            severity: row.severity,
            alertType: row.alert_type,
            country: row.country_name ? {
                id: row.country_id,
                name: row.country_name,
                code: row.country_code
            } : null,
            location: {
                region: row.region,
                latitude: row.latitude,
                longitude: row.longitude,
                radiusKm: row.radius_km
            },
            isActive: row.is_active,
            expiresAt: row.expires_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));

        res.json({
            alerts,
            pagination: {
                total: parseInt(countResult.rows[0].total),
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: parseInt(offset) + result.rows.length < parseInt(countResult.rows[0].total)
            }
        });

    } catch (error) {
        logger.error('Error fetching alerts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get alert statistics
 * GET /api/alerts/stats
 */
router.get('/stats', optionalAuth, async (req, res) => {
    try {
        // Overall alert statistics
        const overallStats = await query(`
            SELECT
                COUNT(*) as total_alerts,
                COUNT(*) FILTER (WHERE is_active = true AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)) as active_alerts,
                COUNT(*) FILTER (WHERE severity = 'emergency') as emergency_alerts,
                COUNT(*) FILTER (WHERE severity = 'critical') as critical_alerts
            FROM alerts
        `);

        // Alerts by type
        const typeStats = await query(`
            SELECT alert_type, COUNT(*) as count
            FROM alerts
            WHERE is_active = true
                AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
            GROUP BY alert_type
            ORDER BY count DESC
        `);

        // Alerts by severity
        const severityStats = await query(`
            SELECT severity, COUNT(*) as count
            FROM alerts
            WHERE is_active = true
                AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
            GROUP BY severity
            ORDER BY
                CASE severity
                    WHEN 'emergency' THEN 1
                    WHEN 'critical' THEN 2
                    WHEN 'warning' THEN 3
                    WHEN 'info' THEN 4
                END
        `);

        // Countries with most alerts
        const countryStats = await query(`
            SELECT c.name, c.code, COUNT(*) as alert_count
            FROM alerts a
            JOIN countries c ON a.country_id = c.id
            WHERE a.is_active = true
                AND (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP)
            GROUP BY c.id, c.name, c.code
            ORDER BY alert_count DESC
            LIMIT 10
        `);

        res.json({
            overall: overallStats.rows[0],
            byType: typeStats.rows,
            bySeverity: severityStats.rows,
            topCountries: countryStats.rows
        });

    } catch (error) {
        logger.error('Error fetching alert statistics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get alert by ID
 * GET /api/alerts/:id
 */
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            SELECT a.*, c.name as country_name, c.code as country_code,
                   c.risk_level, ec.name as embassy_name, ec.phone as embassy_phone,
                   ec.emergency_phone as embassy_emergency_phone
            FROM alerts a
            LEFT JOIN countries c ON a.country_id = c.id
            LEFT JOIN embassy_contacts ec ON c.id = ec.country_id
            WHERE a.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        const alert = result.rows[0];

        // Get notification statistics for this alert (if user is authenticated)
        let notificationStats = null;
        if (req.user) {
            const statsResult = await query(`
                SELECT
                    COUNT(*) as total_sent,
                    COUNT(*) FILTER (WHERE status = 'sent') as successful,
                    COUNT(*) FILTER (WHERE status = 'failed') as failed
                FROM user_notifications
                WHERE alert_id = $1
            `, [id]);
            notificationStats = statsResult.rows[0];
        }

        res.json({
            id: alert.id,
            title: alert.title,
            message: alert.message,
            severity: alert.severity,
            alertType: alert.alert_type,
            country: alert.country_name ? {
                id: alert.country_id,
                name: alert.country_name,
                code: alert.country_code,
                riskLevel: alert.risk_level
            } : null,
            location: {
                region: alert.region,
                latitude: alert.latitude,
                longitude: alert.longitude,
                radiusKm: alert.radius_km
            },
            embassy: alert.embassy_name ? {
                name: alert.embassy_name,
                phone: alert.embassy_phone,
                emergencyPhone: alert.embassy_emergency_phone
            } : null,
            isActive: alert.is_active,
            expiresAt: alert.expires_at,
            createdBy: alert.created_by,
            createdAt: alert.created_at,
            updatedAt: alert.updated_at,
            ...(notificationStats && { notificationStats })
        });

    } catch (error) {
        logger.error('Error fetching alert:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Create new alert (admin only - for demo purposes, simplified auth)
 * POST /api/alerts
 */
router.post('/', [
    authenticateToken,
    body('title').notEmpty().trim(),
    body('message').notEmpty().trim(),
    body('severity').isIn(['info', 'warning', 'critical', 'emergency']),
    body('alertType').isIn(['travel_advisory', 'weather', 'security', 'health', 'embassy']),
    body('countryId').optional().isInt(),
    body('region').optional().trim(),
    body('latitude').optional().isFloat({ min: -90, max: 90 }),
    body('longitude').optional().isFloat({ min: -180, max: 180 }),
    body('radiusKm').optional().isInt({ min: 0 }),
    body('expiresAt').optional().isISO8601()
], async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const {
            title,
            message,
            severity,
            alertType,
            countryId,
            region,
            latitude,
            longitude,
            radiusKm,
            expiresAt
        } = req.body;

        // Validate country exists if provided
        if (countryId) {
            const countryCheck = await query('SELECT id FROM countries WHERE id = $1', [countryId]);
            if (countryCheck.rows.length === 0) {
                return res.status(400).json({ error: 'Invalid country ID' });
            }
        }

        // Create alert
        const result = await query(`
            INSERT INTO alerts (
                title, message, severity, alert_type, country_id,
                region, latitude, longitude, radius_km, expires_at, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `, [
            title, message, severity, alertType, countryId,
            region, latitude, longitude, radiusKm, expiresAt,
            req.user.email // Use user email as creator
        ]);

        const newAlert = result.rows[0];

        // Find affected users based on their travel plans
        const affectedUsersQuery = `
            SELECT DISTINCT u.id, u.email, u.first_name, u.phone,
                   u.sms_enabled, u.push_enabled, u.email_enabled
            FROM users u
            JOIN travel_plans tp ON u.id = tp.user_id
            WHERE tp.is_active = true
                AND tp.destination_country_id = $1
                AND tp.departure_date <= CURRENT_DATE + INTERVAL '30 days'
                AND (tp.return_date IS NULL OR tp.return_date >= CURRENT_DATE)
        `;

        let affectedUsers = [];
        if (countryId) {
            const usersResult = await query(affectedUsersQuery, [countryId]);
            affectedUsers = usersResult.rows;
        }

        // Queue alert processing for notifications
        if (affectedUsers.length > 0) {
            await queueAlert(newAlert, affectedUsers);
            logger.info(`Alert queued for ${affectedUsers.length} users`);
        }

        logger.info(`New alert created: ${newAlert.id} by ${req.user.email}`);

        res.status(201).json({
            message: 'Alert created successfully',
            alert: {
                id: newAlert.id,
                title: newAlert.title,
                message: newAlert.message,
                severity: newAlert.severity,
                alertType: newAlert.alert_type,
                affectedUsers: affectedUsers.length
            }
        });

    } catch (error) {
        logger.error('Error creating alert:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get alerts for user's destinations
 * GET /api/alerts/my-destinations
 */
router.get('/my-destinations', authenticateToken, async (req, res) => {
    try {
        const { limit = 10, severity } = req.query;

        let severityFilter = '';
        const params = [req.user.id];

        if (severity) {
            severityFilter = 'AND a.severity = $2';
            params.push(severity);
        }

        const result = await query(`
            SELECT DISTINCT a.id, a.title, a.message, a.severity, a.alert_type,
                   a.created_at, a.expires_at,
                   c.name as country_name, c.code as country_code,
                   tp.departure_date, tp.return_date
            FROM alerts a
            JOIN countries c ON a.country_id = c.id
            JOIN travel_plans tp ON c.id = tp.destination_country_id
            WHERE tp.user_id = $1
                AND tp.is_active = true
                AND a.is_active = true
                AND (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP)
                ${severityFilter}
            ORDER BY
                CASE a.severity
                    WHEN 'emergency' THEN 1
                    WHEN 'critical' THEN 2
                    WHEN 'warning' THEN 3
                    WHEN 'info' THEN 4
                END,
                a.created_at DESC
            LIMIT $${params.length + 1}
        `, [...params, parseInt(limit)]);

        const alerts = result.rows.map(row => ({
            id: row.id,
            title: row.title,
            message: row.message,
            severity: row.severity,
            alertType: row.alert_type,
            country: {
                name: row.country_name,
                code: row.country_code
            },
            travelDates: {
                departure: row.departure_date,
                return: row.return_date
            },
            createdAt: row.created_at,
            expiresAt: row.expires_at
        }));

        res.json({ alerts });

    } catch (error) {
        logger.error('Error fetching user destination alerts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Update alert (admin only)
 * PUT /api/alerts/:id
 */
router.put('/:id', [
    authenticateToken,
    body('title').optional().notEmpty().trim(),
    body('message').optional().notEmpty().trim(),
    body('severity').optional().isIn(['info', 'warning', 'critical', 'emergency']),
    body('isActive').optional().isBoolean(),
    body('expiresAt').optional().isISO8601()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { id } = req.params;
        const { title, message, severity, isActive, expiresAt } = req.body;

        // Build update query
        const updates = [];
        const params = [id];
        let paramCount = 1;

        if (title !== undefined) {
            paramCount++;
            updates.push(`title = $${paramCount}`);
            params.push(title);
        }

        if (message !== undefined) {
            paramCount++;
            updates.push(`message = $${paramCount}`);
            params.push(message);
        }

        if (severity !== undefined) {
            paramCount++;
            updates.push(`severity = $${paramCount}`);
            params.push(severity);
        }

        if (isActive !== undefined) {
            paramCount++;
            updates.push(`is_active = $${paramCount}`);
            params.push(isActive);
        }

        if (expiresAt !== undefined) {
            paramCount++;
            updates.push(`expires_at = $${paramCount}`);
            params.push(expiresAt);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');

        const result = await query(`
            UPDATE alerts
            SET ${updates.join(', ')}
            WHERE id = $1
            RETURNING *
        `, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        logger.info(`Alert updated: ${id} by ${req.user.email}`);

        res.json({
            message: 'Alert updated successfully',
            alert: result.rows[0]
        });

    } catch (error) {
        logger.error('Error updating alert:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;