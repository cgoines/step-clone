const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const logger = require('../utils/logger');
const { authenticateToken } = require('../middleware/auth');
const { registerDeviceToken, getUserDeviceTokens } = require('../services/pushNotificationService');

const router = express.Router();

/**
 * Get current user profile
 * GET /api/users/profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const result = await query(`
            SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.country_id,
                   u.emergency_contact_name, u.emergency_contact_phone, u.emergency_contact_email,
                   u.passport_number, u.nationality, u.date_of_birth, u.is_verified,
                   u.sms_enabled, u.push_enabled, u.email_enabled, u.created_at, u.updated_at,
                   c.name as country_name, c.code as country_code
            FROM users u
            LEFT JOIN countries c ON u.country_id = c.id
            WHERE u.id = $1
        `, [req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        // Get user's travel plans count
        const travelPlansResult = await query(`
            SELECT COUNT(*) as count
            FROM travel_plans
            WHERE user_id = $1 AND is_active = true
        `, [req.user.id]);

        // Get user's device tokens count
        const deviceTokensResult = await query(`
            SELECT COUNT(*) as count
            FROM device_tokens
            WHERE user_id = $1 AND is_active = true
        `, [req.user.id]);

        res.json({
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone,
            country: user.country_id ? {
                id: user.country_id,
                name: user.country_name,
                code: user.country_code
            } : null,
            emergencyContact: {
                name: user.emergency_contact_name,
                phone: user.emergency_contact_phone,
                email: user.emergency_contact_email
            },
            passport: {
                number: user.passport_number,
                nationality: user.nationality
            },
            dateOfBirth: user.date_of_birth,
            isVerified: user.is_verified,
            preferences: {
                smsEnabled: user.sms_enabled,
                pushEnabled: user.push_enabled,
                emailEnabled: user.email_enabled
            },
            stats: {
                activeTravelPlans: parseInt(travelPlansResult.rows[0].count),
                registeredDevices: parseInt(deviceTokensResult.rows[0].count)
            },
            createdAt: user.created_at,
            updatedAt: user.updated_at
        });

    } catch (error) {
        logger.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Update user profile
 * PUT /api/users/profile
 */
router.put('/profile', [
    authenticateToken,
    body('firstName').optional().notEmpty().trim(),
    body('lastName').optional().notEmpty().trim(),
    body('phone').optional().isMobilePhone(),
    body('countryId').optional().isInt(),
    body('emergencyContactName').optional().trim(),
    body('emergencyContactPhone').optional().isMobilePhone(),
    body('emergencyContactEmail').optional().isEmail().normalizeEmail(),
    body('passportNumber').optional().trim(),
    body('nationality').optional().trim(),
    body('dateOfBirth').optional().isDate()
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
            firstName,
            lastName,
            phone,
            countryId,
            emergencyContactName,
            emergencyContactPhone,
            emergencyContactEmail,
            passportNumber,
            nationality,
            dateOfBirth
        } = req.body;

        // Build update query dynamically
        const updates = [];
        const params = [req.user.id];
        let paramCount = 1;

        if (firstName !== undefined) {
            paramCount++;
            updates.push(`first_name = $${paramCount}`);
            params.push(firstName);
        }

        if (lastName !== undefined) {
            paramCount++;
            updates.push(`last_name = $${paramCount}`);
            params.push(lastName);
        }

        if (phone !== undefined) {
            paramCount++;
            updates.push(`phone = $${paramCount}`);
            params.push(phone);
        }

        if (countryId !== undefined) {
            paramCount++;
            updates.push(`country_id = $${paramCount}`);
            params.push(countryId);
        }

        if (emergencyContactName !== undefined) {
            paramCount++;
            updates.push(`emergency_contact_name = $${paramCount}`);
            params.push(emergencyContactName);
        }

        if (emergencyContactPhone !== undefined) {
            paramCount++;
            updates.push(`emergency_contact_phone = $${paramCount}`);
            params.push(emergencyContactPhone);
        }

        if (emergencyContactEmail !== undefined) {
            paramCount++;
            updates.push(`emergency_contact_email = $${paramCount}`);
            params.push(emergencyContactEmail);
        }

        if (passportNumber !== undefined) {
            paramCount++;
            updates.push(`passport_number = $${paramCount}`);
            params.push(passportNumber);
        }

        if (nationality !== undefined) {
            paramCount++;
            updates.push(`nationality = $${paramCount}`);
            params.push(nationality);
        }

        if (dateOfBirth !== undefined) {
            paramCount++;
            updates.push(`date_of_birth = $${paramCount}`);
            params.push(dateOfBirth);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');

        const result = await query(`
            UPDATE users
            SET ${updates.join(', ')}
            WHERE id = $1
            RETURNING id, first_name, last_name, phone, updated_at
        `, params);

        logger.info(`User profile updated: ${req.user.id}`);

        res.json({
            message: 'Profile updated successfully',
            user: result.rows[0]
        });

    } catch (error) {
        logger.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Update notification preferences
 * PUT /api/users/preferences
 */
router.put('/preferences', [
    authenticateToken,
    body('smsEnabled').optional().isBoolean(),
    body('pushEnabled').optional().isBoolean(),
    body('emailEnabled').optional().isBoolean()
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

        const { smsEnabled, pushEnabled, emailEnabled } = req.body;

        // Build update query
        const updates = [];
        const params = [req.user.id];
        let paramCount = 1;

        if (smsEnabled !== undefined) {
            paramCount++;
            updates.push(`sms_enabled = $${paramCount}`);
            params.push(smsEnabled);
        }

        if (pushEnabled !== undefined) {
            paramCount++;
            updates.push(`push_enabled = $${paramCount}`);
            params.push(pushEnabled);
        }

        if (emailEnabled !== undefined) {
            paramCount++;
            updates.push(`email_enabled = $${paramCount}`);
            params.push(emailEnabled);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No preferences to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');

        const result = await query(`
            UPDATE users
            SET ${updates.join(', ')}
            WHERE id = $1
            RETURNING sms_enabled, push_enabled, email_enabled, updated_at
        `, params);

        logger.info(`User preferences updated: ${req.user.id}`);

        res.json({
            message: 'Preferences updated successfully',
            preferences: {
                smsEnabled: result.rows[0].sms_enabled,
                pushEnabled: result.rows[0].push_enabled,
                emailEnabled: result.rows[0].email_enabled
            },
            updatedAt: result.rows[0].updated_at
        });

    } catch (error) {
        logger.error('Error updating user preferences:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Register device for push notifications
 * POST /api/users/devices
 */
router.post('/devices', [
    authenticateToken,
    body('token').notEmpty().trim(),
    body('platform').isIn(['ios', 'android', 'web'])
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

        const { token, platform } = req.body;

        const deviceToken = await registerDeviceToken(req.user.id, token, platform);

        logger.info(`Device token registered for user ${req.user.id}: ${platform}`);

        res.status(201).json({
            message: 'Device registered successfully',
            device: {
                id: deviceToken.id,
                platform: deviceToken.platform,
                createdAt: deviceToken.created_at
            }
        });

    } catch (error) {
        logger.error('Error registering device token:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get user's registered devices
 * GET /api/users/devices
 */
router.get('/devices', authenticateToken, async (req, res) => {
    try {
        const devices = await getUserDeviceTokens(req.user.id);

        res.json({
            devices: devices.map(device => ({
                platform: device.platform,
                registeredAt: device.created_at
            }))
        });

    } catch (error) {
        logger.error('Error fetching user devices:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get user's notification history
 * GET /api/users/notifications
 */
router.get('/notifications', authenticateToken, async (req, res) => {
    try {
        const { limit = 20, offset = 0, channel, status } = req.query;

        let whereClause = 'WHERE un.user_id = $1';
        const params = [req.user.id];
        let paramCount = 1;

        if (channel) {
            paramCount++;
            whereClause += ` AND un.channel = $${paramCount}`;
            params.push(channel);
        }

        if (status) {
            paramCount++;
            whereClause += ` AND un.status = $${paramCount}`;
            params.push(status);
        }

        const result = await query(`
            SELECT un.id, un.channel, un.status, un.sent_at, un.delivered_at, un.error_message,
                   a.title as alert_title, a.severity, a.alert_type
            FROM user_notifications un
            JOIN alerts a ON un.alert_id = a.id
            ${whereClause}
            ORDER BY un.created_at DESC
            LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `, [...params, parseInt(limit), parseInt(offset)]);

        // Get total count
        const countResult = await query(`
            SELECT COUNT(*) as total
            FROM user_notifications un
            ${whereClause}
        `, params);

        res.json({
            notifications: result.rows,
            pagination: {
                total: parseInt(countResult.rows[0].total),
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: parseInt(offset) + result.rows.length < parseInt(countResult.rows[0].total)
            }
        });

    } catch (error) {
        logger.error('Error fetching user notifications:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Delete user account
 * DELETE /api/users/account
 */
router.delete('/account', authenticateToken, async (req, res) => {
    try {
        // This will cascade delete related records (travel_plans, user_notifications, device_tokens)
        await query('DELETE FROM users WHERE id = $1', [req.user.id]);

        logger.info(`User account deleted: ${req.user.id}`);

        res.json({ message: 'Account deleted successfully' });

    } catch (error) {
        logger.error('Error deleting user account:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;