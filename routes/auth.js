const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const logger = require('../utils/logger');
const { sendWelcomeEmail, sendEmail } = require('../services/emailService');
const crypto = require('crypto');

const router = express.Router();

/**
 * User registration
 * POST /api/auth/register
 */
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    body('phone').optional().isMobilePhone(),
    body('countryId').optional().isInt(),
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
            email,
            password,
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

        // Check if user already exists
        const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'User already exists' });
        }

        // Hash password
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create user
        const result = await query(`
            INSERT INTO users (
                email, password_hash, first_name, last_name, phone, country_id,
                emergency_contact_name, emergency_contact_phone, emergency_contact_email,
                passport_number, nationality, date_of_birth,
                verification_token, verification_token_expires
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id, email, first_name, last_name, phone, created_at
        `, [
            email, passwordHash, firstName, lastName, phone, countryId,
            emergencyContactName, emergencyContactPhone, emergencyContactEmail,
            passportNumber, nationality, dateOfBirth,
            verificationToken, verificationExpires
        ]);

        const newUser = result.rows[0];

        // Generate JWT token
        const token = jwt.sign(
            { userId: newUser.id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Send verification email (async, don't wait)
        const verificationUrl = `${process.env.USER_PORTAL_URL || 'http://localhost:3002'}/verify-email?token=${verificationToken}`;
        const verificationEmailText = `
Dear ${firstName},

Thank you for registering with STEP Clone! To complete your account setup, please verify your email address by clicking the link below:

${verificationUrl}

This verification link will expire in 24 hours.

If you didn't create an account with us, please ignore this email.

Best regards,
The STEP Clone Team
        `;

        const verificationEmailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verify Your Email - STEP Clone</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px 0; }
        .button {
            display: inline-block;
            background-color: #1e40af;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
        }
        .footer { border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Verify Your Email</h1>
        </div>
        <div class="content">
            <p>Dear ${firstName},</p>
            <p>Thank you for registering with STEP Clone! To complete your account setup, please verify your email address by clicking the button below:</p>
            <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <p>This verification link will expire in 24 hours.</p>
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #1e40af;">${verificationUrl}</p>
        </div>
        <div class="footer">
            <p>If you didn't create an account with us, please ignore this email.</p>
            <p>Best regards,<br>The STEP Clone Team</p>
        </div>
    </div>
</body>
</html>
        `;

        sendEmail(email, 'Verify Your Email - STEP Clone', verificationEmailText, verificationEmailHtml).catch(err =>
            logger.error('Failed to send verification email:', err)
        );

        logger.info(`New user registered: ${email}`);

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.first_name,
                lastName: newUser.last_name,
                phone: newUser.phone,
                createdAt: newUser.created_at
            },
            token
        });

    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * User login
 * POST /api/auth/login
 */
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
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

        const { email, password } = req.body;

        // Get user from database
        const result = await query(`
            SELECT id, email, password_hash, first_name, last_name, phone,
                   is_verified, sms_enabled, push_enabled, email_enabled
            FROM users
            WHERE email = $1
        `, [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        logger.info(`User logged in: ${email}`);

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                phone: user.phone,
                isVerified: user.is_verified,
                preferences: {
                    smsEnabled: user.sms_enabled,
                    pushEnabled: user.push_enabled,
                    emailEnabled: user.email_enabled
                }
            },
            token
        });

    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Verify JWT token
 * GET /api/auth/verify
 */
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get updated user info
        const result = await query(`
            SELECT id, email, first_name, last_name, phone, is_verified,
                   sms_enabled, push_enabled, email_enabled
            FROM users
            WHERE id = $1
        `, [decoded.userId]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        res.json({
            valid: true,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                phone: user.phone,
                isVerified: user.is_verified,
                preferences: {
                    smsEnabled: user.sms_enabled,
                    pushEnabled: user.push_enabled,
                    emailEnabled: user.email_enabled
                }
            }
        });

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        logger.error('Token verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Change password
 * POST /api/auth/change-password
 */
router.post('/change-password', [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
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

        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { currentPassword, newPassword } = req.body;

        // Get current password hash
        const result = await query('SELECT password_hash FROM users WHERE id = $1', [decoded.userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const saltRounds = 12;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                   [newPasswordHash, decoded.userId]);

        logger.info(`Password changed for user: ${decoded.userId}`);

        res.json({ message: 'Password changed successfully' });

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        logger.error('Change password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Verify email address
 * POST /api/auth/verify-email
 */
router.post('/verify-email', [
    body('token').notEmpty().withMessage('Verification token is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { token } = req.body;

        // Find user with this verification token
        const result = await query(`
            SELECT id, email, first_name, verification_token_expires, is_verified
            FROM users
            WHERE verification_token = $1
        `, [token]);

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid verification token' });
        }

        const user = result.rows[0];

        // Check if already verified
        if (user.is_verified) {
            return res.status(400).json({ error: 'Email is already verified' });
        }

        // Check if token has expired
        if (new Date() > new Date(user.verification_token_expires)) {
            return res.status(400).json({ error: 'Verification token has expired' });
        }

        // Update user as verified and clear verification token
        await query(`
            UPDATE users
            SET is_verified = TRUE,
                verification_token = NULL,
                verification_token_expires = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [user.id]);

        logger.info(`Email verified for user: ${user.email}`);

        // Send welcome email now that they're verified
        sendWelcomeEmail(user.email, user.first_name).catch(err =>
            logger.error('Failed to send welcome email:', err)
        );

        res.json({ message: 'Email verified successfully' });

    } catch (error) {
        logger.error('Email verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Resend verification email
 * POST /api/auth/resend-verification
 */
router.post('/resend-verification', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user info
        const result = await query(`
            SELECT email, first_name, is_verified
            FROM users
            WHERE id = $1
        `, [decoded.userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];

        if (user.is_verified) {
            return res.status(400).json({ error: 'Email is already verified' });
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Update user with new token
        await query(`
            UPDATE users
            SET verification_token = $1,
                verification_token_expires = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
        `, [verificationToken, verificationExpires, decoded.userId]);

        // Send verification email
        const verificationUrl = `${process.env.USER_PORTAL_URL || 'http://localhost:3002'}/verify-email?token=${verificationToken}`;
        const verificationEmailText = `
Dear ${user.first_name},

Here's your new email verification link:

${verificationUrl}

This verification link will expire in 24 hours.

Best regards,
The STEP Clone Team
        `;

        const verificationEmailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verify Your Email - STEP Clone</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px 0; }
        .button {
            display: inline-block;
            background-color: #1e40af;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
        }
        .footer { border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Verify Your Email</h1>
        </div>
        <div class="content">
            <p>Dear ${user.first_name},</p>
            <p>Here's your new email verification link:</p>
            <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </p>
            <p>This verification link will expire in 24 hours.</p>
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #1e40af;">${verificationUrl}</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>The STEP Clone Team</p>
        </div>
    </div>
</body>
</html>
        `;

        await sendEmail(user.email, 'Verify Your Email - STEP Clone', verificationEmailText, verificationEmailHtml);

        logger.info(`Verification email resent for user: ${user.email}`);
        res.json({ message: 'Verification email sent' });

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        logger.error('Resend verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Request email change
 * POST /api/auth/change-email
 */
router.post('/change-email', [
    body('newEmail').isEmail().normalizeEmail().withMessage('Valid email is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const { newEmail } = req.body;

        // Get current user info
        const userResult = await query(`
            SELECT id, email, first_name, is_verified
            FROM users
            WHERE id = $1
        `, [decoded.userId]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];

        // Check if new email is the same as current
        if (user.email === newEmail) {
            return res.status(400).json({ error: 'New email must be different from current email' });
        }

        // Check if new email already exists
        const existingUser = await query('SELECT id FROM users WHERE email = $1', [newEmail]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: 'Email already exists' });
        }

        // Generate email change token
        const emailChangeToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Store pending email change
        await query(`
            UPDATE users
            SET pending_email = $1,
                email_change_token = $2,
                email_change_token_expires = $3,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
        `, [newEmail, emailChangeToken, tokenExpires, decoded.userId]);

        // Send verification email to new address
        const verificationUrl = `${process.env.USER_PORTAL_URL || 'http://localhost:3002'}/verify-email-change?token=${emailChangeToken}`;
        const verificationEmailText = `
Dear ${user.first_name},

You have requested to change your email address from ${user.email} to ${newEmail}.

To complete this change, please click the link below:

${verificationUrl}

This verification link will expire in 24 hours.

If you didn't request this email change, please ignore this email and contact our support team.

Best regards,
The STEP Clone Team
        `;

        const verificationEmailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verify Email Change - STEP Clone</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px 0; }
        .button {
            display: inline-block;
            background-color: #1e40af;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
        }
        .footer { border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #666; font-size: 14px; }
        .email-change { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Verify Email Change</h1>
        </div>
        <div class="content">
            <p>Dear ${user.first_name},</p>
            <p>You have requested to change your email address:</p>

            <div class="email-change">
                <p><strong>From:</strong> ${user.email}</p>
                <p><strong>To:</strong> ${newEmail}</p>
            </div>

            <p>To complete this change, please click the button below:</p>
            <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Change</a>
            </p>
            <p>This verification link will expire in 24 hours.</p>
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #1e40af;">${verificationUrl}</p>
        </div>
        <div class="footer">
            <p>If you didn't request this email change, please ignore this email and contact our support team.</p>
            <p>Best regards,<br>The STEP Clone Team</p>
        </div>
    </div>
</body>
</html>
        `;

        await sendEmail(newEmail, 'Verify Email Change - STEP Clone', verificationEmailText, verificationEmailHtml);

        logger.info(`Email change requested for user: ${user.email} -> ${newEmail}`);
        res.json({ message: 'Email change verification sent to new address' });

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        logger.error('Change email error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Verify email change
 * POST /api/auth/verify-email-change
 */
router.post('/verify-email-change', [
    body('token').notEmpty().withMessage('Verification token is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { token } = req.body;

        // Find user with this email change token
        const result = await query(`
            SELECT id, email, pending_email, first_name, email_change_token_expires
            FROM users
            WHERE email_change_token = $1
        `, [token]);

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid email change token' });
        }

        const user = result.rows[0];

        // Check if token has expired
        if (new Date() > new Date(user.email_change_token_expires)) {
            return res.status(400).json({ error: 'Email change token has expired' });
        }

        if (!user.pending_email) {
            return res.status(400).json({ error: 'No pending email change found' });
        }

        // Check if new email is still available (someone else might have taken it)
        const existingUser = await query('SELECT id FROM users WHERE email = $1 AND id != $2', [user.pending_email, user.id]);
        if (existingUser.rows.length > 0) {
            // Clear the pending change
            await query(`
                UPDATE users
                SET pending_email = NULL,
                    email_change_token = NULL,
                    email_change_token_expires = NULL,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [user.id]);

            return res.status(409).json({ error: 'Email address is no longer available' });
        }

        // Update email and clear pending change
        await query(`
            UPDATE users
            SET email = $1,
                pending_email = NULL,
                email_change_token = NULL,
                email_change_token_expires = NULL,
                is_verified = TRUE,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [user.pending_email, user.id]);

        logger.info(`Email changed for user: ${user.email} -> ${user.pending_email}`);

        // Send confirmation email to old address
        const confirmationText = `
Dear ${user.first_name},

Your email address has been successfully changed from ${user.email} to ${user.pending_email}.

If you didn't make this change, please contact our support team immediately.

Best regards,
The STEP Clone Team
        `;

        sendEmail(user.email, 'Email Address Changed - STEP Clone', confirmationText).catch(err =>
            logger.error('Failed to send email change confirmation:', err)
        );

        res.json({ message: 'Email address changed successfully' });

    } catch (error) {
        logger.error('Verify email change error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', [
    body('email').isEmail().normalizeEmail()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { email } = req.body;

        // Find user by email
        const userResult = await query(
            'SELECT id, email, first_name, last_name FROM users WHERE email = $1',
            [email]
        );

        // Always return success to avoid email enumeration
        if (userResult.rows.length === 0) {
            logger.info(`Password reset requested for non-existent email: ${email}`);
            return res.json({ message: 'If an account with that email exists, we have sent a password reset link.' });
        }

        const user = userResult.rows[0];

        // Generate password reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

        // Store the reset token in database
        await query(`
            UPDATE users
            SET password_reset_token = $1, password_reset_token_expires = $2, updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
        `, [resetTokenHash, resetTokenExpires, user.id]);

        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3002'}/reset-password?token=${resetToken}`;

        // Email content
        const resetEmailText = `
Hello ${user.first_name},

You requested a password reset for your STEP Clone account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email.

Best regards,
The STEP Clone Team
        `;

        const resetEmailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Reset - STEP Clone</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
        .content { padding: 20px 0; }
        .button {
            display: inline-block;
            background-color: #dc2626;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            margin: 20px 0;
        }
        .footer { border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Reset Your Password</h1>
        </div>
        <div class="content">
            <p>Hello ${user.first_name},</p>
            <p>You requested a password reset for your STEP Clone account.</p>
            <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>This link will expire in 1 hour.</p>
            <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #1e40af;">${resetUrl}</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>The STEP Clone Team</p>
        </div>
    </div>
</body>
</html>
        `;

        // Send password reset email
        await sendEmail(user.email, 'Reset Your Password - STEP Clone', resetEmailText, resetEmailHtml);

        logger.info(`Password reset email sent to: ${email}`);
        res.json({ message: 'If an account with that email exists, we have sent a password reset link.' });

    } catch (error) {
        logger.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
router.post('/reset-password', [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { token, password } = req.body;

        // Hash the token to match what's stored in database
        const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

        // Find user with valid reset token
        const userResult = await query(`
            SELECT id, email, first_name, password_reset_token, password_reset_token_expires
            FROM users
            WHERE password_reset_token = $1 AND password_reset_token_expires > CURRENT_TIMESTAMP
        `, [resetTokenHash]);

        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        const user = userResult.rows[0];

        // Hash new password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Update password and clear reset token
        await query(`
            UPDATE users
            SET password_hash = $1,
                password_reset_token = NULL,
                password_reset_token_expires = NULL,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [hashedPassword, user.id]);

        // Send confirmation email
        const confirmationEmailText = `
Hello ${user.first_name},

Your password has been successfully reset for your STEP Clone account.

If you didn't make this change, please contact our support team immediately.

Best regards,
The STEP Clone Team
        `;

        const confirmationEmailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Reset Successful - STEP Clone</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
        .content { padding: 20px 0; }
        .footer { border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Successful</h1>
        </div>
        <div class="content">
            <p>Hello ${user.first_name},</p>
            <p>Your password has been successfully reset for your STEP Clone account.</p>
            <p>If you didn't make this change, please contact our support team immediately.</p>
        </div>
        <div class="footer">
            <p>Best regards,<br>The STEP Clone Team</p>
        </div>
    </div>
</body>
</html>
        `;

        // Send confirmation email (don't wait for it)
        sendEmail(user.email, 'Password Reset Successful - STEP Clone', confirmationEmailText, confirmationEmailHtml).catch(err =>
            logger.error('Failed to send password reset confirmation:', err)
        );

        logger.info(`Password reset successful for user: ${user.email}`);
        res.json({ message: 'Password has been reset successfully' });

    } catch (error) {
        logger.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;