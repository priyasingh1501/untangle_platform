#!/usr/bin/env node

/**
 * Check Deployment Status
 * 
 * This script checks if our fix is actually deployed and working
 */

const https = require('https');

// Check if our specific fix is deployed by testing the encryption service
async function checkEncryptionFixDeployment() {
  console.log('🔍 Checking if Encryption Fix is Deployed\n');
  
  // Test the health endpoint to see server info
  try {
    const healthResponse = await makeRequest('/api/health');
    console.log('✅ Health endpoint working');
    console.log('📊 Server details:', {
      environment: healthResponse.environment,
      uptime: Math.round(healthResponse.uptime),
      mongodb: healthResponse.mongodb,
      timestamp: healthResponse.timestamp
    });
    
    // Check if this looks like a recent deployment
    const uptimeMinutes = Math.round(healthResponse.uptime / 60);
    console.log(`⏰ Server uptime: ${uptimeMinutes} minutes`);
    
    if (uptimeMinutes < 60) {
      console.log('🆕 Server was recently restarted (likely our deployment)');
    } else {
      console.log('⏳ Server has been running for a while');
    }
    
  } catch (error) {
    console.log('❌ Health endpoint failed:', error.message);
  }
}

// Test if there's a specific issue with authenticated requests
async function testAuthenticatedRequestScenario() {
  console.log('\n🔐 Testing Authenticated Request Scenario\n');
  
  // The issue might be that when a valid token is present, 
  // the encryption service fails during the actual journal creation process
  
  console.log('📋 Hypothesis: The 500 error occurs when:');
  console.log('1. User has a valid authentication token');
  console.log('2. Request reaches the journal creation logic');
  console.log('3. Encryption service fails during the actual encryption process');
  
  // Test if we can detect this by checking the server behavior
  console.log('\n🔍 Testing server behavior patterns...');
  
  // Test multiple endpoints to see if there's a pattern
  const endpoints = [
    { path: '/api/health', method: 'GET', requiresAuth: false },
    { path: '/api/auth/me', method: 'GET', requiresAuth: true },
    { path: '/api/journal', method: 'GET', requiresAuth: true },
    { path: '/api/journal/entries', method: 'GET', requiresAuth: true },
    { path: '/api/journal/entries', method: 'POST', requiresAuth: true }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.method} ${endpoint.path}...`);
      const response = await makeRequest(endpoint.path, endpoint.method);
      console.log(`✅ ${endpoint.path}: Success`);
    } catch (error) {
      if (error.message.includes('500')) {
        console.log(`❌ ${endpoint.path}: 500 Internal Server Error`);
        console.log(`   This endpoint is returning 500 errors!`);
      } else if (error.message.includes('401') || error.message.includes('No token')) {
        console.log(`✅ ${endpoint.path}: Auth required (expected)`);
      } else {
        console.log(`❓ ${endpoint.path}: ${error.message}`);
      }
    }
  }
}

// Check if there's a specific issue with the journal creation logic
async function testJournalCreationLogic() {
  console.log('\n📝 Testing Journal Creation Logic\n');
  
  // Test if the issue is specifically with the POST request to journal entries
  console.log('📋 Testing journal entry creation endpoint...');
  
  try {
    // Test with a request that would trigger the journal creation logic
    const response = await makeRequest('/api/journal/entries', 'POST', {
      title: 'Debug Test',
      content: 'This is a debug test entry',
      type: 'daily',
      mood: 'neutral'
    });
    console.log('❌ Unexpected success without auth');
  } catch (error) {
    if (error.message.includes('500')) {
      console.log('❌ 500 Internal Server Error on journal creation');
      console.log('🔍 This confirms the issue is in the journal creation logic');
      console.log('💡 The problem is likely:');
      console.log('   1. Encryption service failing during journal creation');
      console.log('   2. Database connection issues');
      console.log('   3. Missing environment variables');
      console.log('   4. Our fix not being deployed');
    } else if (error.message.includes('401')) {
      console.log('✅ Expected auth error - endpoint is working');
    } else {
      console.log('❓ Unexpected error:', error.message);
    }
  }
}

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'lyfe-production.up.railway.app',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Deployment-Check/1.0'
      }
    };

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

// Main function
async function main() {
  console.log('🚀 Deployment Status Check\n');
  
  await checkEncryptionFixDeployment();
  await testAuthenticatedRequestScenario();
  await testJournalCreationLogic();
  
  console.log('\n📋 Summary:');
  console.log('If any endpoint returns 500 errors, then:');
  console.log('1. Our encryption fix is not deployed');
  console.log('2. There is a different server issue');
  console.log('3. Environment variables are missing');
  console.log('4. Database connection problems');
  
  console.log('\n🔧 Immediate Actions:');
  console.log('1. Check Railway deployment logs');
  console.log('2. Verify commit 249a70f6 is deployed');
  console.log('3. Check Railway environment variables');
  console.log('4. Look for specific error messages');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}
