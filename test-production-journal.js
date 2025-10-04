#!/usr/bin/env node

/**
 * Comprehensive Production Journal Test
 * 
 * This script tests the journal endpoint with various scenarios to identify the exact issue
 */

const https = require('https');

const PRODUCTION_URL = 'https://lyfe-production.up.railway.app';

// Test scenarios
async function runAllTests() {
  console.log('🚀 Comprehensive Production Journal Test\n');
  
  try {
    // Test 1: Health check
    await testHealthCheck();
    
    // Test 2: Journal endpoint without auth
    await testJournalWithoutAuth();
    
    // Test 3: Check if our encryption fix is deployed
    await testEncryptionFixDeployment();
    
    // Test 4: Test with mock auth token
    await testWithMockAuth();
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

async function testHealthCheck() {
  console.log('🔍 Test 1: Health Check');
  try {
    const response = await makeRequest('/api/health');
    console.log('✅ Health check passed');
    console.log('📊 Server info:', {
      environment: response.environment,
      uptime: Math.round(response.uptime),
      mongodb: response.mongodb,
      timestamp: response.timestamp
    });
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
  console.log('');
}

async function testJournalWithoutAuth() {
  console.log('🔍 Test 2: Journal Endpoint Without Auth');
  try {
    const response = await makeRequest('/api/journal/entries', 'POST', {
      title: 'Test Entry',
      content: 'This is a test journal entry',
      type: 'daily',
      mood: 'neutral'
    });
    console.log('❌ Unexpected success without auth:', response);
  } catch (error) {
    if (error.message.includes('No token') || error.message.includes('authorization denied')) {
      console.log('✅ Expected auth error received');
    } else if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
      console.log('❌ 500 Internal Server Error - This is the problem!');
      console.log('🔍 This suggests the encryption service is still failing');
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }
  console.log('');
}

async function testEncryptionFixDeployment() {
  console.log('🔍 Test 3: Check Encryption Fix Deployment');
  
  // Test if we can access the journal route at all
  try {
    const response = await makeRequest('/api/journal', 'GET');
    console.log('❌ Unexpected success accessing journal without auth');
  } catch (error) {
    if (error.message.includes('No token') || error.message.includes('authorization denied')) {
      console.log('✅ Journal route exists and requires auth');
    } else if (error.message.includes('500')) {
      console.log('❌ 500 error on journal route - encryption issue persists');
    } else {
      console.log('❓ Unexpected response:', error.message);
    }
  }
  console.log('');
}

async function testWithMockAuth() {
  console.log('🔍 Test 4: Test with Mock Auth Token');
  
  // Try with a mock JWT token to see if we get past auth
  const mockToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzRkYjFhYzQ5YzQ4YzQ4YzQ4YzQ4YzQiLCJpYXQiOjE3MzU5NzI0NzYsImV4cCI6MTczNTk3NjA3Nn0.mock';
  
  try {
    const response = await makeRequest('/api/journal/entries', 'POST', {
      title: 'Test Entry',
      content: 'This is a test journal entry',
      type: 'daily',
      mood: 'neutral'
    }, mockToken);
    console.log('❌ Unexpected success with mock token');
  } catch (error) {
    if (error.message.includes('invalid token') || error.message.includes('jwt')) {
      console.log('✅ Auth validation working - got expected JWT error');
    } else if (error.message.includes('500')) {
      console.log('❌ 500 error even with auth token - encryption service failing');
    } else {
      console.log('❓ Unexpected auth error:', error.message);
    }
  }
  console.log('');
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
        'User-Agent': 'Production-Test/1.0'
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

// Additional debugging function
async function debugEncryptionService() {
  console.log('🔐 Debugging Encryption Service...\n');
  
  // Check if we can access any endpoints that might reveal encryption status
  const endpoints = [
    '/api/health',
    '/api/auth/me',
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
      } else if (error.message.includes('No token')) {
        console.log(`✅ ${endpoint}: Auth required (expected)`);
      } else {
        console.log(`❓ ${endpoint}: ${error.message}`);
      }
    }
  }
}

// Main function
async function main() {
  await runAllTests();
  await debugEncryptionService();
  
  console.log('\n📋 Diagnosis Summary:');
  console.log('If you see 500 errors on journal endpoints, the issue is likely:');
  console.log('1. Encryption service initialization failing');
  console.log('2. Database connection issues');
  console.log('3. Missing environment variables');
  console.log('4. Code deployment issues');
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Check Railway deployment logs for specific errors');
  console.log('2. Verify all environment variables are set');
  console.log('3. Check if the latest code is actually deployed');
  console.log('4. Test with a valid authentication token');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}
