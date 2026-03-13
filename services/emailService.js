const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create reusable transporter object using SMTP transport
let transporter;

const initializeEmailService = () => {
    if (process.env.EMAIL_SERVICE === 'gmail') {
        transporter = nodemailer.createTransporter({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });
    } else if (process.env.SMTP_HOST) {
        transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });
    } else {
        // Development mode - log emails instead of sending
        transporter = nodemailer.createTransporter({
            streamTransport: true,
            newline: 'unix',
            buffer: true
        });
    }
};

// Initialize on module load
initializeEmailService();

/**
 * Send email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content (optional)
 * @returns {Promise<object>} - Send result
 */
const sendEmail = async (to, subject, text, html = null) => {
    try {
        const mailOptions = {
            from: process.env.FROM_EMAIL || 'noreply@stepclone.com',
            to,
            subject,
            text,
            html: html || generateHTMLFromText(text)
        };

        logger.info(`Sending email to ${to}: ${subject}`);

        const result = await transporter.sendMail(mailOptions);

        // In development mode, log the email content
        if (!process.env.SMTP_HOST && !process.env.EMAIL_SERVICE) {
            logger.info('Email content (development mode):', {
                to,
                subject,
                text: text.substring(0, 200) + '...'
            });
        }

        logger.info(`Email sent successfully to ${to}`);
        return result;
    } catch (error) {
        logger.error(`Failed to send email to ${to}:`, error);
        throw error;
    }
};

/**
 * Send travel alert email
 * @param {string} to - Recipient email
 * @param {string} alertTitle - Alert title
 * @param {string} alertMessage - Alert message
 * @param {string} severity - Alert severity
 * @param {string} country - Affected country
 * @returns {Promise<object>} - Send result
 */
const sendTravelAlertEmail = async (to, alertTitle, alertMessage, severity, country) => {
    const subject = `Travel Alert: ${alertTitle}`;

    const text = `
Travel Alert - ${severity.toUpperCase()}

${alertTitle}

${alertMessage}

Country: ${country || 'Multiple locations'}

This is an automated message from the STEP Clone system.
Please do not reply to this email.

Stay safe and informed,
STEP Clone Team
    `;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Travel Alert</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
        .alert-box {
            border-left: 5px solid ${getSeverityColor(severity)};
            padding: 15px;
            margin: 20px 0;
            background-color: #f8f9fa;
        }
        .severity {
            color: ${getSeverityColor(severity)};
            font-weight: bold;
            text-transform: uppercase;
        }
        .footer {
            border-top: 1px solid #eee;
            padding-top: 20px;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Travel Alert</h1>
        </div>

        <div class="alert-box">
            <p class="severity">Severity: ${severity}</p>
            <h2>${alertTitle}</h2>
            <p>${alertMessage}</p>
            ${country ? `<p><strong>Affected Location:</strong> ${country}</p>` : ''}
        </div>

        <div class="footer">
            <p>This is an automated message from the STEP Clone system.</p>
            <p>Please do not reply to this email.</p>
            <p>Stay safe and informed,<br>STEP Clone Team</p>
        </div>
    </div>
</body>
</html>
    `;

    return await sendEmail(to, subject, text, html);
};

/**
 * Send welcome email to new users
 * @param {string} to - Recipient email
 * @param {string} firstName - User's first name
 * @returns {Promise<object>} - Send result
 */
const sendWelcomeEmail = async (to, firstName) => {
    const subject = 'Welcome to STEP Clone - Your Travel Safety Companion';

    const text = `
Dear ${firstName},

Welcome to STEP Clone! Thank you for enrolling in our travel safety notification system.

Your account has been successfully created and you will now receive:
- Travel advisories for your destinations
- Emergency alerts and safety information
- Embassy contact information
- Weather-related travel warnings

To get started:
1. Log in to your account
2. Add your travel plans
3. Update your notification preferences
4. Keep your contact information current

We're committed to keeping you informed and safe during your travels.

Best regards,
The STEP Clone Team
    `;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to STEP Clone</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px 0; }
        .features { background-color: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .footer { border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to STEP Clone</h1>
        </div>

        <div class="content">
            <p>Dear ${firstName},</p>
            <p>Welcome to STEP Clone! Thank you for enrolling in our travel safety notification system.</p>

            <div class="features">
                <h3>You will receive:</h3>
                <ul>
                    <li>Travel advisories for your destinations</li>
                    <li>Emergency alerts and safety information</li>
                    <li>Embassy contact information</li>
                    <li>Weather-related travel warnings</li>
                </ul>
            </div>

            <h3>To get started:</h3>
            <ol>
                <li>Log in to your account</li>
                <li>Add your travel plans</li>
                <li>Update your notification preferences</li>
                <li>Keep your contact information current</li>
            </ol>

            <p>We're committed to keeping you informed and safe during your travels.</p>
        </div>

        <div class="footer">
            <p>Best regards,<br>The STEP Clone Team</p>
        </div>
    </div>
</body>
</html>
    `;

    return await sendEmail(to, subject, text, html);
};

/**
 * Generate basic HTML from plain text
 * @param {string} text - Plain text
 * @returns {string} - HTML content
 */
const generateHTMLFromText = (text) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    </style>
</head>
<body>
    <div class="container">
        ${text.split('\n').map(line => `<p>${line}</p>`).join('')}
    </div>
</body>
</html>
    `;
};

/**
 * Get color based on severity level
 * @param {string} severity - Alert severity
 * @returns {string} - Color code
 */
const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
        case 'emergency': return '#dc2626';
        case 'critical': return '#ea580c';
        case 'warning': return '#d97706';
        case 'info': return '#2563eb';
        default: return '#6b7280';
    }
};

/**
 * Test email configuration
 * @returns {Promise<boolean>} - True if configuration is valid
 */
const testEmailConfiguration = async () => {
    try {
        await transporter.verify();
        logger.info('Email service configuration is valid');
        return true;
    } catch (error) {
        logger.error('Email service configuration test failed:', error);
        return false;
    }
};

module.exports = {
    sendEmail,
    sendTravelAlertEmail,
    sendWelcomeEmail,
    testEmailConfiguration
};