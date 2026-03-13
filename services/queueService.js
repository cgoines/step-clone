const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const logger = require('../utils/logger');
const smsService = require('./smsService');
const pushNotificationService = require('./pushNotificationService');
const emailService = require('./emailService');

// Redis connection
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Create queues
const alertQueue = new Queue('alerts', { connection: redisConnection });
const notificationQueue = new Queue('notifications', { connection: redisConnection });
const smsQueue = new Queue('sms', { connection: redisConnection });
const pushQueue = new Queue('push', { connection: redisConnection });
const emailQueue = new Queue('email', { connection: redisConnection });

// Queue processors
const processAlert = async (job) => {
    const { alertId, affectedUsers } = job.data;
    logger.info(`Processing alert ${alertId} for ${affectedUsers.length} users`);

    // Create notification jobs for each user
    for (const user of affectedUsers) {
        // Add SMS notification if user has SMS enabled
        if (user.sms_enabled && user.phone) {
            await smsQueue.add('send-alert-sms', {
                userId: user.id,
                alertId,
                phone: user.phone,
                message: `Travel Alert: ${job.data.alertTitle}. ${job.data.alertMessage}`
            }, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                }
            });
        }

        // Add push notification if user has push enabled
        if (user.push_enabled) {
            await pushQueue.add('send-alert-push', {
                userId: user.id,
                alertId,
                title: job.data.alertTitle,
                message: job.data.alertMessage,
                severity: job.data.severity
            }, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                }
            });
        }

        // Add email notification if user has email enabled
        if (user.email_enabled && user.email) {
            await emailQueue.add('send-alert-email', {
                userId: user.id,
                alertId,
                email: user.email,
                subject: `Travel Alert: ${job.data.alertTitle}`,
                message: job.data.alertMessage
            }, {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                }
            });
        }
    }

    logger.info(`Alert ${alertId} processing completed`);
};

const processSMS = async (job) => {
    const { userId, alertId, phone, message } = job.data;

    try {
        logger.info(`Sending SMS to ${phone} for alert ${alertId}`);
        await smsService.sendSMS(phone, message);

        // Update notification status
        await updateNotificationStatus(userId, alertId, 'sms', 'sent');

        logger.info(`SMS sent successfully to ${phone}`);
    } catch (error) {
        logger.error(`Failed to send SMS to ${phone}:`, error);
        await updateNotificationStatus(userId, alertId, 'sms', 'failed', error.message);
        throw error;
    }
};

const processPushNotification = async (job) => {
    const { userId, alertId, title, message, severity } = job.data;

    try {
        logger.info(`Sending push notification to user ${userId} for alert ${alertId}`);
        await pushNotificationService.sendNotification(userId, title, message, severity);

        // Update notification status
        await updateNotificationStatus(userId, alertId, 'push', 'sent');

        logger.info(`Push notification sent successfully to user ${userId}`);
    } catch (error) {
        logger.error(`Failed to send push notification to user ${userId}:`, error);
        await updateNotificationStatus(userId, alertId, 'push', 'failed', error.message);
        throw error;
    }
};

const processEmail = async (job) => {
    const { userId, alertId, email, subject, message } = job.data;

    try {
        logger.info(`Sending email to ${email} for alert ${alertId}`);
        await emailService.sendEmail(email, subject, message);

        // Update notification status
        await updateNotificationStatus(userId, alertId, 'email', 'sent');

        logger.info(`Email sent successfully to ${email}`);
    } catch (error) {
        logger.error(`Failed to send email to ${email}:`, error);
        await updateNotificationStatus(userId, alertId, 'email', 'failed', error.message);
        throw error;
    }
};

// Helper function to update notification status
const updateNotificationStatus = async (userId, alertId, channel, status, errorMessage = null) => {
    const { query } = require('../config/database');

    try {
        await query(`
            UPDATE user_notifications
            SET status = $1, sent_at = CURRENT_TIMESTAMP, error_message = $2
            WHERE user_id = $3 AND alert_id = $4 AND channel = $5
        `, [status, errorMessage, userId, alertId, channel]);
    } catch (error) {
        logger.error('Failed to update notification status:', error);
    }
};

// Initialize workers
let alertWorker, smsWorker, pushWorker, emailWorker;

const initializeQueues = async () => {
    try {
        // Alert processing worker
        alertWorker = new Worker('alerts', processAlert, {
            connection: redisConnection,
            concurrency: 5
        });

        // SMS processing worker
        smsWorker = new Worker('sms', processSMS, {
            connection: redisConnection,
            concurrency: 10
        });

        // Push notification worker
        pushWorker = new Worker('push', processPushNotification, {
            connection: redisConnection,
            concurrency: 10
        });

        // Email worker
        emailWorker = new Worker('email', processEmail, {
            connection: redisConnection,
            concurrency: 10
        });

        // Error handling
        [alertWorker, smsWorker, pushWorker, emailWorker].forEach(worker => {
            worker.on('failed', (job, err) => {
                logger.error(`Job ${job.id} failed:`, err);
            });

            worker.on('completed', (job) => {
                logger.info(`Job ${job.id} completed successfully`);
            });
        });

        logger.info('All queue workers initialized successfully');
    } catch (error) {
        logger.error('Failed to initialize queues:', error);
        throw error;
    }
};

// Add job to alert queue
const queueAlert = async (alertData, affectedUsers) => {
    try {
        const job = await alertQueue.add('process-alert', {
            alertId: alertData.id,
            alertTitle: alertData.title,
            alertMessage: alertData.message,
            severity: alertData.severity,
            affectedUsers
        }, {
            attempts: 5,
            backoff: {
                type: 'exponential',
                delay: 2000,
            }
        });

        logger.info(`Alert job ${job.id} queued for alert ${alertData.id}`);
        return job;
    } catch (error) {
        logger.error('Failed to queue alert:', error);
        throw error;
    }
};

module.exports = {
    initializeQueues,
    queueAlert,
    alertQueue,
    notificationQueue,
    smsQueue,
    pushQueue,
    emailQueue
};