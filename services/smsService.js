const twilio = require('twilio');
const logger = require('../utils/logger');

// Initialize Twilio client conditionally
let client = null;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (accountSid && authToken && accountSid.startsWith('AC')) {
    client = twilio(accountSid, authToken);
    logger.info('Twilio client initialized');
} else {
    logger.warn('Twilio not configured - SMS functionality will be mocked');
}

const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

/**
 * Send SMS message using Twilio
 * @param {string} to - Phone number to send SMS to
 * @param {string} message - Message content
 * @returns {Promise<object>} - Twilio message object
 */
const sendSMS = async (to, message) => {
    try {
        // Validate phone number format
        if (!to || !to.match(/^\+?[1-9]\d{1,14}$/)) {
            throw new Error('Invalid phone number format');
        }

        // Ensure phone number has country code
        const phoneNumber = to.startsWith('+') ? to : `+1${to}`;

        logger.info(`Sending SMS to ${phoneNumber}`);

        // Mock SMS if Twilio not configured
        if (!client) {
            const mockResult = {
                sid: `mock_${Date.now()}`,
                status: 'sent',
                to: phoneNumber,
                from: TWILIO_PHONE_NUMBER || '+15551234567'
            };

            logger.info(`SMS sent successfully (mocked)`, {
                sid: mockResult.sid,
                to: phoneNumber,
                status: mockResult.status
            });

            return mockResult;
        }

        const result = await client.messages.create({
            body: message,
            from: TWILIO_PHONE_NUMBER,
            to: phoneNumber
        });

        logger.info(`SMS sent successfully`, {
            sid: result.sid,
            to: phoneNumber,
            status: result.status
        });

        return result;
    } catch (error) {
        logger.error('SMS sending failed:', {
            to,
            error: error.message,
            code: error.code
        });
        throw error;
    }
};

/**
 * Send bulk SMS messages
 * @param {Array} recipients - Array of {phone, message} objects
 * @returns {Promise<Array>} - Array of results
 */
const sendBulkSMS = async (recipients) => {
    const results = [];
    const batchSize = 10; // Process in batches to avoid rate limiting

    for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        const batchPromises = batch.map(({ phone, message }) =>
            sendSMS(phone, message).catch(error => ({
                phone,
                error: error.message,
                success: false
            }))
        );

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Small delay between batches to respect rate limits
        if (i + batchSize < recipients.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    logger.info(`Bulk SMS completed: ${results.length} messages processed`);
    return results;
};

/**
 * Validate phone number
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} - True if valid
 */
const validatePhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return false;

    // Basic phone number validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber.replace(/\s|-|\(|\)/g, ''));
};

/**
 * Format phone number for Twilio
 * @param {string} phoneNumber - Raw phone number
 * @returns {string} - Formatted phone number with country code
 */
const formatPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return null;

    // Remove all non-digits
    const digits = phoneNumber.replace(/\D/g, '');

    // If it starts with 1 and has 11 digits, assume US number
    if (digits.length === 11 && digits.startsWith('1')) {
        return `+${digits}`;
    }

    // If it has 10 digits, assume US number without country code
    if (digits.length === 10) {
        return `+1${digits}`;
    }

    // If it already starts with +, return as is
    if (phoneNumber.startsWith('+')) {
        return phoneNumber;
    }

    // Otherwise, add + prefix
    return `+${digits}`;
};

/**
 * Get SMS delivery status
 * @param {string} messageSid - Twilio message SID
 * @returns {Promise<object>} - Message status
 */
const getSMSStatus = async (messageSid) => {
    try {
        // Mock status if Twilio not configured
        if (!client) {
            return {
                sid: messageSid,
                status: 'delivered',
                errorCode: null,
                errorMessage: null,
                dateCreated: new Date(),
                dateSent: new Date(),
                dateUpdated: new Date()
            };
        }

        const message = await client.messages(messageSid).fetch();
        return {
            sid: message.sid,
            status: message.status,
            errorCode: message.errorCode,
            errorMessage: message.errorMessage,
            dateCreated: message.dateCreated,
            dateSent: message.dateSent,
            dateUpdated: message.dateUpdated
        };
    } catch (error) {
        logger.error('Failed to fetch SMS status:', error);
        throw error;
    }
};

module.exports = {
    sendSMS,
    sendBulkSMS,
    validatePhoneNumber,
    formatPhoneNumber,
    getSMSStatus
};