#!/usr/bin/env node

/**
 * Generate Production Encryption Key
 * 
 * This script generates a secure encryption key for production use.
 * Run this script and add the output to your production environment variables.
 */

const crypto = require('crypto');

console.log('🔐 Generating Production Encryption Key...\n');

// Generate a secure 32-character hex key (16 bytes for AES-256)
const encryptionKey = crypto.randomBytes(16).toString('hex');

console.log('✅ Generated secure encryption key:');
console.log('ENCRYPTION_KEY=' + encryptionKey);
console.log('\n📋 Instructions:');
console.log('1. Copy the ENCRYPTION_KEY value above');
console.log('2. Add it to your production environment variables:');
console.log('   - Railway: Project Settings > Variables');
console.log('   - Vercel: Project Settings > Environment Variables');
console.log('   - Docker: Add to your .env file');
console.log('3. Restart your production application');
console.log('\n⚠️  Important:');
console.log('- Keep this key secure and never commit it to version control');
console.log('- This key is required for decrypting existing journal entries');
console.log('- If you lose this key, encrypted data cannot be recovered');
console.log('\n🔍 Key Details:');
console.log(`- Length: ${encryptionKey.length} characters`);
console.log('- Format: Hexadecimal string');
console.log('- Algorithm: AES-256-GCM');
console.log('- Purpose: Journal entry encryption/decryption');

