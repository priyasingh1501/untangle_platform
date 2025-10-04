#!/usr/bin/env node

/**
 * Secure Environment Setup Script
 * Generates secure secrets and validates environment configuration
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔐 Secure Environment Setup');
console.log('==========================\n');

// Generate secure secrets
function generateSecureSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

// Validate secret strength
function validateSecret(secret, name) {
  if (!secret) {
    throw new Error(`${name} is required`);
  }
  
  if (secret.length < 32) {
    throw new Error(`${name} must be at least 32 characters long`);
  }
  
  if (secret.includes('your-') || secret.includes('SAMPLE_') || secret.includes('example')) {
    throw new Error(`${name} contains placeholder text. Please set a real value.`);
  }
  
  return true;
}

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', 'env.example');

if (!fs.existsSync(envPath)) {
  console.log('❌ No .env file found. Please copy env.example to .env first:');
  console.log('   cp env.example .env');
  process.exit(1);
}

// Read current .env file
let envContent = fs.readFileSync(envPath, 'utf8');

// Generate secure secrets if needed
const secrets = {
  JWT_SECRET: generateSecureSecret(64),
  JWT_REFRESH_SECRET: generateSecureSecret(64),
  ENCRYPTION_KEY: generateSecureSecret(32),
  CSRF_SECRET: generateSecureSecret(32)
};

console.log('🔑 Generated secure secrets:');
Object.entries(secrets).forEach(([key, value]) => {
  console.log(`   ${key}: ${value.substring(0, 16)}...`);
});

// Update .env file with secure secrets
Object.entries(secrets).forEach(([key, value]) => {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, `${key}=${value}`);
  } else {
    envContent += `\n${key}=${value}`;
  }
});

// Write updated .env file
fs.writeFileSync(envPath, envContent);

console.log('\n✅ Updated .env file with secure secrets');

// Validate critical environment variables
console.log('\n🔍 Validating environment configuration...');

const requiredVars = [
  'MONGODB_URI',
  'JWT_SECRET', 
  'JWT_REFRESH_SECRET',
  'ENCRYPTION_KEY',
  'CSRF_SECRET'
];

const missingVars = [];
const weakVars = [];

requiredVars.forEach(varName => {
  const match = envContent.match(new RegExp(`^${varName}=(.*)$`, 'm'));
  if (!match) {
    missingVars.push(varName);
  } else {
    const value = match[1].trim();
    try {
      validateSecret(value, varName);
    } catch (error) {
      weakVars.push({ var: varName, error: error.message });
    }
  }
});

if (missingVars.length > 0) {
  console.log('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.log(`   - ${varName}`));
}

if (weakVars.length > 0) {
  console.log('❌ Weak or placeholder environment variables:');
  weakVars.forEach(({ var: varName, error }) => console.log(`   - ${varName}: ${error}`));
}

if (missingVars.length === 0 && weakVars.length === 0) {
  console.log('✅ All environment variables are properly configured');
  
  console.log('\n🛡️ Security Checklist:');
  console.log('   ✅ JWT secrets are secure (64+ characters)');
  console.log('   ✅ Encryption key is secure (32+ characters)');
  console.log('   ✅ CSRF secret is configured');
  console.log('   ✅ Database URI is configured');
  console.log('   ✅ No placeholder values detected');
  
  console.log('\n🚀 Environment is ready for secure deployment!');
} else {
  console.log('\n⚠️ Please fix the issues above before deployment');
  process.exit(1);
}

// Security recommendations
console.log('\n📋 Security Recommendations:');
console.log('   1. Never commit .env file to version control');
console.log('   2. Use different secrets for each environment');
console.log('   3. Rotate secrets regularly in production');
console.log('   4. Use secret management services in production');
console.log('   5. Monitor for unauthorized access attempts');


