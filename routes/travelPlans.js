const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const logger = require('../utils/logger');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * Create new travel plan
 * POST /api/travel-plans
 */
router.post('/', [
    authenticateToken,
    body('destinationCountryId').isInt().withMessage('Valid destination country ID required'),
    body('departureDate').isDate().withMessage('Valid departure date required'),
    body('returnDate').optional().isDate(),
    body('purpose').optional().isIn(['business', 'tourism', 'study', 'family', 'other']),
    body('accommodationAddress').optional().trim(),
    body('localContactName').optional().trim(),
    body('localContactPhone').optional().trim()
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
            destinationCountryId,
            departureDate,
            returnDate,
            purpose,
            accommodationAddress,
            localContactName,
            localContactPhone
        } = req.body;

        // Validate departure date is not in the past
        const today = new Date();
        const departure = new Date(departureDate);
        if (departure < today.setHours(0, 0, 0, 0)) {
            return res.status(400).json({ error: 'Departure date cannot be in the past' });
        }

        // Validate return date is after departure date
        if (returnDate) {
            const returnDt = new Date(returnDate);
            if (returnDt <= departure) {
                return res.status(400).json({ error: 'Return date must be after departure date' });
            }
        }

        // Check if destination country exists
        const countryCheck = await query('SELECT id, name FROM countries WHERE id = $1', [destinationCountryId]);
        if (countryCheck.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid destination country' });
        }

        const country = countryCheck.rows[0];

        // Create travel plan
        const result = await query(`
            INSERT INTO travel_plans (
                user_id, destination_country_id, departure_date, return_date,
                purpose, accommodation_address, local_contact_name, local_contact_phone
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [
            req.user.id,
            destinationCountryId,
            departureDate,
            returnDate,
            purpose,
            accommodationAddress,
            localContactName,
            localContactPhone
        ]);

        const travelPlan = result.rows[0];

        logger.info(`Travel plan created for user ${req.user.id}: ${country.name}`);

        res.status(201).json({
            message: 'Travel plan created successfully',
            travelPlan: {
                id: travelPlan.id,
                destination: {
                    id: country.id,
                    name: country.name
                },
                departureDate: travelPlan.departure_date,
                returnDate: travelPlan.return_date,
                purpose: travelPlan.purpose,
                accommodationAddress: travelPlan.accommodation_address,
                localContact: {
                    name: travelPlan.local_contact_name,
                    phone: travelPlan.local_contact_phone
                },
                isActive: travelPlan.is_active,
                createdAt: travelPlan.created_at
            }
        });

    } catch (error) {
        logger.error('Error creating travel plan:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get user's travel plans
 * GET /api/travel-plans
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { status = 'active', limit = 20, offset = 0 } = req.query;

        let whereClause = 'WHERE tp.user_id = $1';
        const params = [req.user.id];
        let paramCount = 1;

        if (status === 'active') {
            whereClause += ' AND tp.is_active = true';
        } else if (status === 'inactive') {
            whereClause += ' AND tp.is_active = false';
        }

        const result = await query(`
            SELECT tp.id, tp.departure_date, tp.return_date, tp.purpose,
                   tp.accommodation_address, tp.local_contact_name, tp.local_contact_phone,
                   tp.is_active, tp.created_at, tp.updated_at,
                   c.id as country_id, c.name as country_name, c.code as country_code,
                   c.risk_level, c.latitude, c.longitude
            FROM travel_plans tp
            JOIN countries c ON tp.destination_country_id = c.id
            ${whereClause}
            ORDER BY tp.departure_date DESC
            LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `, [...params, parseInt(limit), parseInt(offset)]);

        // Get total count
        const countResult = await query(`
            SELECT COUNT(*) as total
            FROM travel_plans tp
            ${whereClause}
        `, params);

        const travelPlans = result.rows.map(row => ({
            id: row.id,
            destination: {
                id: row.country_id,
                name: row.country_name,
                code: row.country_code,
                riskLevel: row.risk_level,
                latitude: row.latitude,
                longitude: row.longitude
            },
            departureDate: row.departure_date,
            returnDate: row.return_date,
            purpose: row.purpose,
            accommodationAddress: row.accommodation_address,
            localContact: {
                name: row.local_contact_name,
                phone: row.local_contact_phone
            },
            isActive: row.is_active,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));

        res.json({
            travelPlans,
            pagination: {
                total: parseInt(countResult.rows[0].total),
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: parseInt(offset) + result.rows.length < parseInt(countResult.rows[0].total)
            }
        });

    } catch (error) {
        logger.error('Error fetching travel plans:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get specific travel plan
 * GET /api/travel-plans/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            SELECT tp.*, c.name as country_name, c.code as country_code,
                   c.risk_level, c.latitude, c.longitude
            FROM travel_plans tp
            JOIN countries c ON tp.destination_country_id = c.id
            WHERE tp.id = $1 AND tp.user_id = $2
        `, [id, req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Travel plan not found' });
        }

        const plan = result.rows[0];

        // Get related alerts for this destination
        const alertsResult = await query(`
            SELECT id, title, message, severity, alert_type, created_at, expires_at
            FROM alerts
            WHERE country_id = $1 AND is_active = true
                AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
            ORDER BY severity DESC, created_at DESC
            LIMIT 10
        `, [plan.destination_country_id]);

        res.json({
            id: plan.id,
            destination: {
                id: plan.destination_country_id,
                name: plan.country_name,
                code: plan.country_code,
                riskLevel: plan.risk_level,
                latitude: plan.latitude,
                longitude: plan.longitude
            },
            departureDate: plan.departure_date,
            returnDate: plan.return_date,
            purpose: plan.purpose,
            accommodationAddress: plan.accommodation_address,
            localContact: {
                name: plan.local_contact_name,
                phone: plan.local_contact_phone
            },
            isActive: plan.is_active,
            createdAt: plan.created_at,
            updatedAt: plan.updated_at,
            recentAlerts: alertsResult.rows
        });

    } catch (error) {
        logger.error('Error fetching travel plan:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Update travel plan
 * PUT /api/travel-plans/:id
 */
router.put('/:id', [
    authenticateToken,
    body('departureDate').optional().isDate(),
    body('returnDate').optional().isDate(),
    body('purpose').optional().isIn(['business', 'tourism', 'study', 'family', 'other']),
    body('accommodationAddress').optional().trim(),
    body('localContactName').optional().trim(),
    body('localContactPhone').optional().trim()
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

        const { id } = req.params;
        const {
            departureDate,
            returnDate,
            purpose,
            accommodationAddress,
            localContactName,
            localContactPhone
        } = req.body;

        // Check if travel plan exists and belongs to user
        const existingPlan = await query(`
            SELECT id FROM travel_plans WHERE id = $1 AND user_id = $2
        `, [id, req.user.id]);

        if (existingPlan.rows.length === 0) {
            return res.status(404).json({ error: 'Travel plan not found' });
        }

        // Validate dates if provided
        if (departureDate && returnDate) {
            const departure = new Date(departureDate);
            const returnDt = new Date(returnDate);
            if (returnDt <= departure) {
                return res.status(400).json({ error: 'Return date must be after departure date' });
            }
        }

        // Build update query
        const updates = [];
        const params = [id, req.user.id];
        let paramCount = 2;

        if (departureDate !== undefined) {
            paramCount++;
            updates.push(`departure_date = $${paramCount}`);
            params.push(departureDate);
        }

        if (returnDate !== undefined) {
            paramCount++;
            updates.push(`return_date = $${paramCount}`);
            params.push(returnDate);
        }

        if (purpose !== undefined) {
            paramCount++;
            updates.push(`purpose = $${paramCount}`);
            params.push(purpose);
        }

        if (accommodationAddress !== undefined) {
            paramCount++;
            updates.push(`accommodation_address = $${paramCount}`);
            params.push(accommodationAddress);
        }

        if (localContactName !== undefined) {
            paramCount++;
            updates.push(`local_contact_name = $${paramCount}`);
            params.push(localContactName);
        }

        if (localContactPhone !== undefined) {
            paramCount++;
            updates.push(`local_contact_phone = $${paramCount}`);
            params.push(localContactPhone);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');

        const result = await query(`
            UPDATE travel_plans
            SET ${updates.join(', ')}
            WHERE id = $1 AND user_id = $2
            RETURNING *
        `, params);

        logger.info(`Travel plan updated: ${id} by user ${req.user.id}`);

        res.json({
            message: 'Travel plan updated successfully',
            travelPlan: result.rows[0]
        });

    } catch (error) {
        logger.error('Error updating travel plan:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Deactivate travel plan
 * DELETE /api/travel-plans/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            UPDATE travel_plans
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND user_id = $2
            RETURNING id
        `, [id, req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Travel plan not found' });
        }

        logger.info(`Travel plan deactivated: ${id} by user ${req.user.id}`);

        res.json({ message: 'Travel plan deactivated successfully' });

    } catch (error) {
        logger.error('Error deactivating travel plan:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get upcoming departures for user
 * GET /api/travel-plans/upcoming
 */
router.get('/upcoming', authenticateToken, async (req, res) => {
    try {
        const { days = 30 } = req.query;

        const result = await query(`
            SELECT tp.id, tp.departure_date, tp.return_date, tp.purpose,
                   c.name as country_name, c.code as country_code, c.risk_level
            FROM travel_plans tp
            JOIN countries c ON tp.destination_country_id = c.id
            WHERE tp.user_id = $1
                AND tp.is_active = true
                AND tp.departure_date >= CURRENT_DATE
                AND tp.departure_date <= CURRENT_DATE + INTERVAL '${parseInt(days)} days'
            ORDER BY tp.departure_date ASC
        `, [req.user.id]);

        res.json({
            upcomingTravels: result.rows.map(row => ({
                id: row.id,
                destination: {
                    name: row.country_name,
                    code: row.country_code,
                    riskLevel: row.risk_level
                },
                departureDate: row.departure_date,
                returnDate: row.return_date,
                purpose: row.purpose,
                daysUntilDeparture: Math.ceil((new Date(row.departure_date) - new Date()) / (1000 * 60 * 60 * 24))
            }))
        });

    } catch (error) {
        logger.error('Error fetching upcoming travel plans:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get travel statistics for user
 * GET /api/travel-plans/stats
 */
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const statsResult = await query(`
            SELECT
                COUNT(*) as total_plans,
                COUNT(*) FILTER (WHERE is_active = true) as active_plans,
                COUNT(*) FILTER (WHERE departure_date >= CURRENT_DATE) as future_plans,
                COUNT(*) FILTER (WHERE departure_date < CURRENT_DATE AND (return_date IS NULL OR return_date >= CURRENT_DATE)) as current_travels,
                COUNT(DISTINCT destination_country_id) as countries_visited
            FROM travel_plans
            WHERE user_id = $1
        `, [req.user.id]);

        const purposeResult = await query(`
            SELECT purpose, COUNT(*) as count
            FROM travel_plans
            WHERE user_id = $1 AND is_active = true
            GROUP BY purpose
            ORDER BY count DESC
        `, [req.user.id]);

        const riskResult = await query(`
            SELECT c.risk_level, COUNT(*) as count
            FROM travel_plans tp
            JOIN countries c ON tp.destination_country_id = c.id
            WHERE tp.user_id = $1 AND tp.is_active = true
            GROUP BY c.risk_level
            ORDER BY count DESC
        `, [req.user.id]);

        res.json({
            overview: statsResult.rows[0],
            byPurpose: purposeResult.rows,
            byRiskLevel: riskResult.rows
        });

    } catch (error) {
        logger.error('Error fetching travel statistics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;