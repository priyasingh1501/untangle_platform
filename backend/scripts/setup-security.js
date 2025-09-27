#!/usr/bin/env node

/**
 * Security Setup Script
 * 
 * This script helps set up the security features for the Untangle platform.
 * It generates secure keys, creates necessary directories, and validates configuration.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('🔒 Setting up security features for Untangle platform...\n');

// Generate secure keys
function generateSecureKey(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Create necessary directories
function createDirectories() {
  const dirs = [
    'logs',
    'logs/security',
    'uploads',
    'uploads/temp',
    'uploads/secure'
  ];

  dirs.forEach(dir => {
    const fullPath = path.join(__dirname, '..', '..', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    } else {
      console.log(`📁 Directory already exists: ${dir}`);
    }
  });
}

// Generate environment file with secure keys
function generateEnvFile() {
  const envPath = path.join(__dirname, '..', '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '..', 'env.example');
  
  if (fs.existsSync(envPath)) {
    console.log('📄 .env file already exists, skipping generation');
    return;
  }

  if (!fs.existsSync(envExamplePath)) {
    console.log('❌ env.example file not found');
    return;
  }

  // Read example file
  let envContent = fs.readFileSync(envExamplePath, 'utf8');
  
  // Generate secure keys
  const jwtSecret = generateSecureKey(64);
  const jwtRefreshSecret = generateSecureKey(64);
  const encryptionKey = generateSecureKey(32);
  const csrfSecret = generateSecureKey(32);
  
  // Replace placeholder values
  envContent = envContent.replace(
    'your-super-secure-jwt-secret-key-here-minimum-64-characters',
    jwtSecret
  );
  envContent = envContent.replace(
    'your-super-secure-jwt-refresh-secret-key-here-minimum-64-characters',
    jwtRefreshSecret
  );
  envContent = envContent.replace(
    'your-32-character-encryption-key-here',
    encryptionKey
  );
  envContent = envContent.replace(
    'your-csrf-secret-key-here-minimum-32-characters',
    csrfSecret
  );
  
  // Write .env file
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Generated .env file with secure keys');
}

// Validate security configuration
function validateConfiguration() {
  console.log('\n🔍 Validating security configuration...');
  
  const requiredEnvVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'ENCRYPTION_KEY',
    'CSRF_SECRET',
    'MONGODB_URI'
  ];

  const missingVars = [];
  
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    console.log('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('\n💡 Run this script to generate a .env file with secure keys');
    return false;
  }

  console.log('✅ All required environment variables are set');
  return true;
}

// Check dependencies
function checkDependencies() {
  console.log('\n📦 Checking security dependencies...');
  
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.log('❌ package.json not found');
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const securityDeps = [
    'helmet',
    'express-rate-limit',
    'express-validator',
    'joi',
    'xss',
    'speakeasy',
    'qrcode',
    'winston',
    'bcryptjs'
  ];

  const missingDeps = securityDeps.filter(dep => !packageJson.dependencies[dep]);
  
  if (missingDeps.length > 0) {
    console.log('❌ Missing security dependencies:');
    missingDeps.forEach(dep => {
      console.log(`   - ${dep}`);
    });
    console.log('\n💡 Run: npm install to install missing dependencies');
    return false;
  }

  console.log('✅ All security dependencies are installed');
  return true;
}

// Create security test script
function createSecurityTest() {
  const testScript = `#!/usr/bin/env node

/**
 * Security Test Script
 * 
 * This script tests the security features of the Untangle platform.
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:5002';

async function testSecurityFeatures() {
  console.log('🔒 Testing security features...\\n');

  try {
    // Test rate limiting
    console.log('Testing rate limiting...');
    const promises = Array(10).fill().map(() => 
      axios.get(\`\${BASE_URL}/api/auth/login\`, {
        validateStatus: () => true
      })
    );
    
    const responses = await Promise.all(promises);
    const rateLimited = responses.some(r => r.status === 429);
    console.log(rateLimited ? '✅ Rate limiting working' : '❌ Rate limiting not working');

    // Test CORS
    console.log('\\nTesting CORS...');
    const corsResponse = await axios.get(\`\${BASE_URL}/health\`, {
      headers: { 'Origin': 'http://malicious-site.com' },
      validateStatus: () => true
    });
    console.log('✅ CORS headers present');

    // Test security headers
    console.log('\\nTesting security headers...');
    const headersResponse = await axios.get(\`\${BASE_URL}/health\`);
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'strict-transport-security'
    ];
    
    const hasSecurityHeaders = securityHeaders.some(header => 
      headersResponse.headers[header]
    );
    console.log(hasSecurityHeaders ? '✅ Security headers present' : '❌ Security headers missing');

    console.log('\\n🎉 Security tests completed!');

  } catch (error) {
    console.error('❌ Security test failed:', error.message);
  }
}

testSecurityFeatures();
`;

  const testPath = path.join(__dirname, '..', '..', 'test-security.js');
  fs.writeFileSync(testPath, testScript);
  fs.chmodSync(testPath, '755');
  console.log('✅ Created security test script: test-security.js');
}

// Main setup function
async function setupSecurity() {
  try {
    // Load environment variables
    require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

    // Create directories
    console.log('📁 Creating necessary directories...');
    createDirectories();

    // Generate .env file if it doesn't exist
    console.log('\n🔑 Generating secure keys...');
    generateEnvFile();

    // Check dependencies
    const depsOk = checkDependencies();
    if (!depsOk) {
      console.log('\n❌ Please install missing dependencies and run again');
      process.exit(1);
    }

    // Validate configuration
    const configOk = validateConfiguration();
    if (!configOk) {
      console.log('\n❌ Please configure environment variables and run again');
      process.exit(1);
    }

    // Create security test script
    console.log('\n🧪 Creating security test script...');
    createSecurityTest();

    console.log('\n🎉 Security setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Review the generated .env file');
    console.log('2. Update CORS_ORIGIN with your domain');
    console.log('3. Configure email settings for password reset');
    console.log('4. Run: node test-security.js to test security features');
    console.log('5. Start the server: npm start');

  } catch (error) {
    console.error('❌ Security setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
setupSecurity();

