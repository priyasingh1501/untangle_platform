#!/usr/bin/env node

/**
 * Generate Environment Secrets
 * This script generates secure random strings for JWT secrets and encryption keys
 */

const crypto = require('crypto');

console.log('🔐 Generating secure environment variables...\n');

// Generate JWT Secret (64 characters)
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log('JWT_SECRET=' + jwtSecret);

// Generate JWT Refresh Secret (64 characters)
const jwtRefreshSecret = crypto.randomBytes(32).toString('hex');
console.log('JWT_REFRESH_SECRET=' + jwtRefreshSecret);

// Generate Encryption Key (32 characters)
const encryptionKey = crypto.randomBytes(16).toString('hex');
console.log('ENCRYPTION_KEY=' + encryptionKey);

// Generate CSRF Secret (32 characters)
const csrfSecret = crypto.randomBytes(16).toString('hex');
console.log('CSRF_SECRET=' + csrfSecret);

console.log('\n✅ Copy these values to your .env file');
console.log('📝 Make sure to keep these secrets secure!');
console.log('🚀 Never commit these to version control!');
