#!/usr/bin/env node

/**
 * Debug Real Authentication Flow
 * 
 * This script tests the actual authentication flow to identify the real issue
 */

const https = require('https');

const PRODUCTION_URL = 'https://lyfe-production.up.railway.app';

// Test the complete authentication flow
async function testCompleteAuthFlow() {
  console.log('🔐 Testing Complete Authentication Flow\n');
  
  // Step 1: Test login endpoint
  console.log('📋 Step 1: Testing Login Endpoint');
  try {
    const loginResponse = await makeRequest('/api/auth/login', 'POST', {
      email: 'test@example.com',
      password: 'testpassword'
    });
    console.log('✅ Login endpoint accessible');
  } catch (error) {
    if (error.message.includes('400') || error.message.includes('Invalid credentials')) {
      console.log('✅ Login endpoint working (expected validation error)');
    } else if (error.message.includes('500')) {
      console.log('❌ Login endpoint returning 500 error');
    } else {
      console.log('❓ Login endpoint error:', error.message);
    }
  }
  
  // Step 2: Test registration endpoint
  console.log('\n📋 Step 2: Testing Registration Endpoint');
  try {
    const regResponse = await makeRequest('/api/auth/register', 'POST', {
      email: 'test@example.com',
      password: 'testpassword',
      name: 'Test User'
    });
    console.log('✅ Registration endpoint accessible');
  } catch (error) {
    if (error.message.includes('400') || error.message.includes('already exists')) {
      console.log('✅ Registration endpoint working (expected validation error)');
    } else if (error.message.includes('500')) {
      console.log('❌ Registration endpoint returning 500 error');
    } else {
      console.log('❓ Registration endpoint error:', error.message);
    }
  }
  
  // Step 3: Test journal endpoint with different scenarios
  console.log('\n📋 Step 3: Testing Journal Endpoint Scenarios');
  
  // Test with empty token
  try {
    const response = await makeRequest('/api/journal/entries', 'POST', {
      title: 'Test',
      content: 'Test content'
    }, '');
    console.log('❌ Unexpected success with empty token');
  } catch (error) {
    if (error.message.includes('No token')) {
      console.log('✅ Empty token properly rejected');
    } else if (error.message.includes('500')) {
      console.log('❌ 500 error with empty token - server issue');
    } else {
      console.log('❓ Unexpected error with empty token:', error.message);
    }
  }
  
  // Test with malformed token
  try {
    const response = await makeRequest('/api/journal/entries', 'POST', {
      title: 'Test',
      content: 'Test content'
    }, 'Bearer invalid-token');
    console.log('❌ Unexpected success with invalid token');
  } catch (error) {
    if (error.message.includes('invalid') || error.message.includes('401')) {
      console.log('✅ Invalid token properly rejected');
    } else if (error.message.includes('500')) {
      console.log('❌ 500 error with invalid token - server issue');
    } else {
      console.log('❓ Unexpected error with invalid token:', error.message);
    }
  }
}

// Test if there's a specific issue with the journal route
async function testJournalRouteIssues() {
  console.log('\n🔍 Testing Journal Route Issues\n');
  
  const testCases = [
    { name: 'GET /api/journal', method: 'GET', path: '/api/journal' },
    { name: 'GET /api/journal/entries', method: 'GET', path: '/api/journal/entries' },
    { name: 'POST /api/journal/entries (minimal)', method: 'POST', path: '/api/journal/entries', data: { title: 'Test', content: 'Test' } },
    { name: 'POST /api/journal/entries (full)', method: 'POST', path: '/api/journal/entries', data: { title: 'Test', content: 'Test', type: 'daily', mood: 'neutral' } }
  ];
  
  for (const testCase of testCases) {
    console.log(`📋 Testing: ${testCase.name}`);
    try {
      const response = await makeRequest(testCase.path, testCase.method, testCase.data);
      console.log('❌ Unexpected success without auth');
    } catch (error) {
      if (error.message.includes('No token') || error.message.includes('401')) {
        console.log('✅ Properly requires authentication');
      } else if (error.message.includes('500')) {
        console.log('❌ 500 Internal Server Error - This is the problem!');
        console.log(`   Error: ${error.message}`);
      } else {
        console.log(`❓ Unexpected error: ${error.message}`);
      }
    }
    console.log('');
  }
}

// Test if the issue is with our specific fix
async function testEncryptionFixStatus() {
  console.log('\n🔐 Testing Encryption Fix Status\n');
  
  // Check if we can access any endpoint that would use encryption
  const endpoints = [
    '/api/health',
    '/api/auth/login',
    '/api/auth/register',
    '/api/journal',
    '/api/journal/entries'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      const response = await makeRequest(endpoint);
      console.log(`✅ ${endpoint}: Success`);
    } catch (error) {
      if (error.message.includes('500')) {
        console.log(`❌ ${endpoint}: 500 Internal Server Error`);
        console.log(`   This suggests our encryption fix may not be deployed or there's another issue`);
      } else if (error.message.includes('No token') || error.message.includes('401')) {
        console.log(`✅ ${endpoint}: Auth required (expected)`);
      } else {
        console.log(`❓ ${endpoint}: ${error.message}`);
      }
    }
  }
}

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET', data = null, authToken = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'lyfe-production.up.railway.app',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Debug-Auth/1.0'
      }
    };

    if (authToken) {
      options.headers['Authorization'] = authToken;
    }

    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`${parsed.message || `HTTP ${res.statusCode}`} (Status: ${res.statusCode})`));
          }
        } catch (e) {
          reject(new Error(`Invalid JSON response (Status: ${res.statusCode}): ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Check if there's a deployment issue
async function checkDeploymentStatus() {
  console.log('\n🚀 Checking Deployment Status\n');
  
  // Test a simple endpoint that should always work
  try {
    const healthResponse = await makeRequest('/api/health');
    console.log('✅ Health endpoint working');
    console.log('📊 Server info:', {
      environment: healthResponse.environment,
      uptime: Math.round(healthResponse.uptime),
      mongodb: healthResponse.mongodb
    });
    
    // Check if this is actually our latest deployment
    if (healthResponse.environment === 'production') {
      console.log('✅ Running in production environment');
    }
    
  } catch (error) {
    console.log('❌ Health endpoint failed:', error.message);
    console.log('🔍 This suggests a serious deployment issue');
  }
}

// Main function
async function main() {
  console.log('🚀 Real Authentication Debug Test\n');
  
  await checkDeploymentStatus();
  await testCompleteAuthFlow();
  await testJournalRouteIssues();
  await testEncryptionFixStatus();
  
  console.log('\n📋 Diagnosis Summary:');
  console.log('If you see 500 errors on journal endpoints, the issue is:');
  console.log('1. Our encryption fix is not deployed');
  console.log('2. There is a different server error');
  console.log('3. Environment variables are not set correctly');
  console.log('4. Database connection issues');
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Check Railway deployment logs for actual errors');
  console.log('2. Verify commit 249a70f6 is actually deployed');
  console.log('3. Check Railway environment variables');
  console.log('4. Look for specific error messages in server logs');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}
