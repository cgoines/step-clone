const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { pool } = require('./config/database');
const logger = require('./utils/logger');
const { initializeQueues } = require('./services/queueService');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const travelPlanRoutes = require('./routes/travelPlans');
const alertRoutes = require('./routes/alerts');
const notificationRoutes = require('./routes/notifications');
const countryRoutes = require('./routes/countries');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Check database connection
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();

        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: 'connected',
                redis: 'connected' // TODO: Add Redis health check
            }
        });
    } catch (error) {
        logger.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            error: 'Database connection failed'
        });
    }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/travel-plans', travelPlanRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/countries', countryRoutes);

// Basic info endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'STEP Clone API',
        description: 'Smart Traveler Enrollment Program Clone',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            travelPlans: '/api/travel-plans',
            alerts: '/api/alerts',
            notifications: '/api/notifications',
            countries: '/api/countries'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);

    // Don't leak error details in production
    const isDev = process.env.NODE_ENV === 'development';

    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal server error',
            ...(isDev && { stack: err.stack })
        }
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Initialize queues and start server
async function startServer() {
    try {
        // Initialize job queues
        await initializeQueues();
        logger.info('Job queues initialized');

        // Start server
        app.listen(PORT, () => {
            logger.info(`STEP Clone API server running on port ${PORT}`);
            logger.info(`Health check: http://localhost:${PORT}/health`);
            logger.info(`API documentation: http://localhost:${PORT}/api`);
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await pool.end();
    process.exit(0);
});

process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await pool.end();
    process.exit(0);
});

startServer();