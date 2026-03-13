const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Middleware to authenticate JWT token
 */
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database to ensure they still exist and are active
        const result = await query(`
            SELECT id, email, first_name, last_name, is_verified
            FROM users
            WHERE id = $1
        `, [decoded.userId]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Attach user info to request
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            ...result.rows[0]
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ error: 'Invalid token' });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(403).json({ error: 'Token expired' });
        } else {
            logger.error('Authentication error:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
};

/**
 * Middleware to check if user is verified (optional requirement)
 */
const requireVerified = (req, res, next) => {
    if (!req.user.is_verified) {
        return res.status(403).json({ error: 'Account verification required' });
    }
    next();
};

/**
 * Middleware for optional authentication (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return next(); // No token, continue without user
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const result = await query(`
            SELECT id, email, first_name, last_name, is_verified
            FROM users
            WHERE id = $1
        `, [decoded.userId]);

        if (result.rows.length > 0) {
            req.user = {
                id: decoded.userId,
                email: decoded.email,
                ...result.rows[0]
            };
        }

        next();
    } catch (error) {
        // If token is invalid, just continue without user
        next();
    }
};

module.exports = {
    authenticateToken,
    requireVerified,
    optionalAuth
};