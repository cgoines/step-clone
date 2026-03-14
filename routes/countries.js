const express = require('express');
const { query } = require('../config/database');
const logger = require('../utils/logger');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * Get all countries
 * GET /api/countries
 */
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { search, riskLevel, limit = 100, offset = 0 } = req.query;

        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramCount = 0;

        // Add search filter
        if (search) {
            paramCount++;
            whereClause += ` AND (name ILIKE $${paramCount} OR code ILIKE $${paramCount} OR iso_code ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        // Add risk level filter
        if (riskLevel) {
            paramCount++;
            whereClause += ` AND risk_level = $${paramCount}`;
            params.push(riskLevel);
        }

        // Add pagination
        paramCount++;
        const limitValue = Math.min(parseInt(limit), 200); // Max 200 results
        whereClause += ` ORDER BY name LIMIT $${paramCount}`;
        params.push(limitValue);

        if (offset > 0) {
            paramCount++;
            whereClause += ` OFFSET $${paramCount}`;
            params.push(parseInt(offset));
        }

        const result = await query(`
            SELECT id, name, code, iso_code, latitude, longitude, risk_level, updated_at
            FROM countries
            ${whereClause}
        `, params);

        // Get total count for pagination
        const countResult = await query(`
            SELECT COUNT(*) as total FROM countries
            ${whereClause.split(' ORDER BY')[0]}
        `, params.slice(0, -2)); // Remove limit and offset params

        res.json({
            countries: result.rows,
            pagination: {
                total: parseInt(countResult.rows[0].total),
                limit: limitValue,
                offset: parseInt(offset),
                hasMore: parseInt(offset) + result.rows.length < parseInt(countResult.rows[0].total)
            }
        });

    } catch (error) {
        logger.error('Error fetching countries:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get country statistics
 * GET /api/countries/stats
 */
router.get('/stats', optionalAuth, async (req, res) => {
    try {
        const result = await query(`
            SELECT
                risk_level,
                COUNT(*) as count
            FROM countries
            GROUP BY risk_level
            ORDER BY
                CASE risk_level
                    WHEN 'low' THEN 1
                    WHEN 'medium' THEN 2
                    WHEN 'high' THEN 3
                    WHEN 'critical' THEN 4
                END
        `);

        const totalResult = await query('SELECT COUNT(*) as total FROM countries');

        // Get recent alerts count by country
        const alertsResult = await query(`
            SELECT
                c.name,
                c.risk_level,
                COUNT(a.id) as active_alerts
            FROM countries c
            LEFT JOIN alerts a ON c.id = a.country_id
                AND a.is_active = true
                AND (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP)
            GROUP BY c.id, c.name, c.risk_level
            HAVING COUNT(a.id) > 0
            ORDER BY COUNT(a.id) DESC
            LIMIT 10
        `);

        res.json({
            total: parseInt(totalResult.rows[0].total),
            byRiskLevel: result.rows,
            countriesWithActiveAlerts: alertsResult.rows
        });

    } catch (error) {
        logger.error('Error fetching country statistics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get country by ID
 * GET /api/countries/:id
 */
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(`
            SELECT c.*,
                   COUNT(ec.id) as embassy_count
            FROM countries c
            LEFT JOIN embassy_contacts ec ON c.id = ec.country_id
            WHERE c.id = $1
            GROUP BY c.id
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Country not found' });
        }

        const country = result.rows[0];

        // Get embassy contacts for this country
        const embassyResult = await query(`
            SELECT name, address, phone, email, emergency_phone, website
            FROM embassy_contacts
            WHERE country_id = $1
            ORDER BY name
        `, [id]);

        res.json({
            ...country,
            embassies: embassyResult.rows
        });

    } catch (error) {
        logger.error('Error fetching country:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get countries by risk level
 * GET /api/countries/risk/:level
 */
router.get('/risk/:level', optionalAuth, async (req, res) => {
    try {
        const { level } = req.params;
        const validLevels = ['low', 'medium', 'high', 'critical'];

        if (!validLevels.includes(level)) {
            return res.status(400).json({
                error: 'Invalid risk level',
                validLevels
            });
        }

        const result = await query(`
            SELECT id, name, code, iso_code, risk_level, updated_at
            FROM countries
            WHERE risk_level = $1
            ORDER BY name
        `, [level]);

        res.json({
            riskLevel: level,
            count: result.rows.length,
            countries: result.rows
        });

    } catch (error) {
        logger.error('Error fetching countries by risk level:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Search countries (autocomplete)
 * GET /api/countries/search
 */
router.get('/search', optionalAuth, async (req, res) => {
    try {
        const { q, limit = 10 } = req.query;

        if (!q || q.length < 2) {
            return res.status(400).json({ error: 'Query must be at least 2 characters' });
        }

        const searchLimit = Math.min(parseInt(limit), 50);

        const result = await query(`
            SELECT id, name, code, iso_code, risk_level
            FROM countries
            WHERE name ILIKE $1 OR code ILIKE $1 OR iso_code ILIKE $1
            ORDER BY
                CASE
                    WHEN name ILIKE $2 THEN 1
                    WHEN name ILIKE $1 THEN 2
                    WHEN code ILIKE $1 THEN 3
                    ELSE 4
                END,
                name
            LIMIT $3
        `, [`%${q}%`, `${q}%`, searchLimit]);

        res.json(result.rows);

    } catch (error) {
        logger.error('Error searching countries:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;