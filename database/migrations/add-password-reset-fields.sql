-- Migration: Add password reset fields to users table
-- Run this if upgrading an existing database

ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_reset_token_expires TIMESTAMP;