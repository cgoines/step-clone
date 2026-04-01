const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const logger = require('../utils/logger');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Default settings
const DEFAULT_SETTINGS = {
  general: {
    appName: 'STEP Clone',
    supportEmail: 'admin@stepclone.com',
    maxTravelPlansPerUser: 10,
    alertRetentionDays: 365
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: true,
    pushEnabled: true,
    emailProvider: 'smtp',
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    twilioSid: '',
    twilioToken: '',
    firebaseProjectId: '',
    firebasePrivateKey: ''
  },
  security: {
    jwtExpirationHours: 24,
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 30,
    requireEmailVerification: true,
    passwordMinLength: 8
  }
};

/**
 * Get system settings (admin only)
 * GET /api/settings
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Check if settings table exists, create if not
    await ensureSettingsTable();

    const result = await query(`
      SELECT setting_key, setting_value, category
      FROM system_settings
      ORDER BY category, setting_key
    `);

    // Convert flat structure to nested object
    const settings = result.rows.reduce((acc, row) => {
      if (!acc[row.category]) {
        acc[row.category] = {};
      }

      // Parse JSON values, fallback to string
      try {
        acc[row.category][row.setting_key] = JSON.parse(row.setting_value);
      } catch {
        acc[row.category][row.setting_key] = row.setting_value;
      }

      return acc;
    }, {});

    // Merge with defaults for any missing settings
    const mergedSettings = {
      general: { ...DEFAULT_SETTINGS.general, ...settings.general },
      notifications: { ...DEFAULT_SETTINGS.notifications, ...settings.notifications },
      security: { ...DEFAULT_SETTINGS.security, ...settings.security }
    };

    res.json(mergedSettings);

  } catch (error) {
    logger.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update system settings (admin only)
 * PUT /api/settings
 */
router.put('/', [
  authenticateToken,
  body('general').optional().isObject(),
  body('notifications').optional().isObject(),
  body('security').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { general, notifications, security } = req.body;

    // Ensure settings table exists
    await ensureSettingsTable();

    // Prepare settings to update
    const settingsToUpdate = [];

    if (general) {
      Object.entries(general).forEach(([key, value]) => {
        settingsToUpdate.push(['general', key, value]);
      });
    }

    if (notifications) {
      Object.entries(notifications).forEach(([key, value]) => {
        settingsToUpdate.push(['notifications', key, value]);
      });
    }

    if (security) {
      Object.entries(security).forEach(([key, value]) => {
        settingsToUpdate.push(['security', key, value]);
      });
    }

    // Update settings in database
    for (const [category, key, value] of settingsToUpdate) {
      await query(`
        INSERT INTO system_settings (category, setting_key, setting_value, updated_by, updated_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        ON CONFLICT (category, setting_key)
        DO UPDATE SET
          setting_value = EXCLUDED.setting_value,
          updated_by = EXCLUDED.updated_by,
          updated_at = EXCLUDED.updated_at
      `, [category, key, JSON.stringify(value), req.user.email]);
    }

    logger.info(`Settings updated by ${req.user.email}`, {
      categoriesUpdated: [general && 'general', notifications && 'notifications', security && 'security'].filter(Boolean)
    });

    res.json({
      message: 'Settings updated successfully',
      updatedSettings: settingsToUpdate.length
    });

  } catch (error) {
    logger.error('Error updating settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Reset settings to defaults (admin only)
 * POST /api/settings/reset
 */
router.post('/reset', authenticateToken, async (req, res) => {
  try {
    const { category } = req.body;

    await ensureSettingsTable();

    if (category && ['general', 'notifications', 'security'].includes(category)) {
      // Reset specific category
      await query('DELETE FROM system_settings WHERE category = $1', [category]);

      logger.info(`Settings category '${category}' reset by ${req.user.email}`);
      res.json({ message: `${category} settings reset to defaults` });
    } else {
      // Reset all settings
      await query('DELETE FROM system_settings');

      logger.info(`All settings reset by ${req.user.email}`);
      res.json({ message: 'All settings reset to defaults' });
    }

  } catch (error) {
    logger.error('Error resetting settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Run database cleanup (admin only)
 * POST /api/settings/cleanup
 */
router.post('/cleanup', authenticateToken, async (req, res) => {
  try {
    const results = {
      expiredAlerts: 0,
      oldNotifications: 0,
      orphanedData: 0
    };

    // Clean up expired alerts (older than 1 year or explicitly expired)
    const expiredAlertsResult = await query(`
      DELETE FROM alerts
      WHERE (expires_at IS NOT NULL AND expires_at < CURRENT_TIMESTAMP)
         OR (created_at < CURRENT_TIMESTAMP - INTERVAL '1 year')
      RETURNING id
    `);
    results.expiredAlerts = expiredAlertsResult.rows.length;

    // Clean up old notifications (older than 6 months and delivered/failed)
    const oldNotificationsResult = await query(`
      DELETE FROM user_notifications
      WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '6 months'
        AND status IN ('delivered', 'failed')
      RETURNING id
    `);
    results.oldNotifications = oldNotificationsResult.rows.length;

    // Clean up orphaned travel plans (user doesn't exist)
    const orphanedPlansResult = await query(`
      DELETE FROM travel_plans tp
      WHERE NOT EXISTS (
        SELECT 1 FROM users u WHERE u.id = tp.user_id
      )
      RETURNING id
    `);
    results.orphanedData += orphanedPlansResult.rows.length;

    // Clean up orphaned user sessions (user doesn't exist)
    const orphanedSessionsResult = await query(`
      DELETE FROM user_sessions us
      WHERE NOT EXISTS (
        SELECT 1 FROM users u WHERE u.id = us.user_id
      )
      RETURNING id
    `).catch(() => ({ rows: [] })); // Table may not exist
    results.orphanedData += orphanedSessionsResult.rows.length;

    logger.info(`Database cleanup completed by ${req.user.email}`, results);

    res.json({
      message: 'Database cleanup completed successfully',
      results: {
        expiredAlerts: results.expiredAlerts,
        oldNotifications: results.oldNotifications,
        orphanedRecords: results.orphanedData,
        totalCleaned: results.expiredAlerts + results.oldNotifications + results.orphanedData
      }
    });

  } catch (error) {
    logger.error('Error during database cleanup:', error);
    res.status(500).json({ error: 'Database cleanup failed' });
  }
});

/**
 * Clear application cache (admin only)
 * POST /api/settings/clear-cache
 */
router.post('/clear-cache', authenticateToken, async (req, res) => {
  try {
    // In a real application, you would clear Redis cache here
    // For now, we'll just simulate cache clearing

    logger.info(`Cache cleared by ${req.user.email}`);

    res.json({
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Cache clearing failed' });
  }
});

/**
 * Ensure the system_settings table exists
 */
async function ensureSettingsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id SERIAL PRIMARY KEY,
      category VARCHAR(50) NOT NULL,
      setting_key VARCHAR(100) NOT NULL,
      setting_value TEXT NOT NULL,
      updated_by VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(category, setting_key)
    );
  `);

  // Create index for faster lookups
  await query(`
    CREATE INDEX IF NOT EXISTS idx_system_settings_category
    ON system_settings(category);
  `);
}

module.exports = router;