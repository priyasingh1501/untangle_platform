#!/usr/bin/env node

/**
 * Test Exact Frontend Request
 * 
 * This script tests the exact request the frontend is making to identify the discrepancy
 */

const https = require('https');

// Test the exact URL and request format from the frontend
async function testExactFrontendRequest() {
  console.log('🔍 Testing Exact Frontend Request\n');
  
  // The exact URL from the error message
  const url = 'https://lyfe-production.up.railway.app/api/journal/entries';
  console.log('📤 Testing URL:', url);
  
  // Test with the exact request format from Journal.jsx
  const requestData = {
    title: 'Test Entry',
    content: 'This is a test journal entry',
    type: 'daily',
    mood: 'neutral',
    tags: [],
    isPrivate: false,
    mindfulnessDimensions: {
      presence: { rating: 0 },
      emotionAwareness: { rating: 0 },
      intentionality: { rating: 0 },
      attentionQuality: { rating: 0 },
      compassion: { rating: 0 }
    }
  };
  
  console.log('📤 Request data:', JSON.stringify(requestData, null, 2));
  
  try {
    const response = await makeExactRequest(url, 'POST', requestData);
    console.log('✅ Request successful:', response);
  } catch (error) {
    console.log('❌ Request failed:', error.message);
    
    // Check if this is actually a 500 error
    if (error.message.includes('500')) {
      console.log('🚨 CONFIRMED: This is a real 500 Internal Server Error!');
      console.log('🔍 The backend is actually returning 500 errors');
    } else if (error.message.includes('401') || error.message.includes('No token')) {
      console.log('✅ This is an authentication error (expected without token)');
    } else {
      console.log('❓ Unexpected error type:', error.message);
    }
  }
}

// Test with different authentication scenarios
async function testWithDifferentAuthScenarios() {
  console.log('\n🔐 Testing Different Authentication Scenarios\n');
  
  const url = 'https://lyfe-production.up.railway.app/api/journal/entries';
  const requestData = {
    title: 'Test Entry',
    content: 'This is a test journal entry'
  };
  
  // Scenario 1: No auth header
  console.log('📋 Scenario 1: No Authorization Header');
  try {
    const response = await makeExactRequest(url, 'POST', requestData);
    console.log('❌ Unexpected success');
  } catch (error) {
    if (error.message.includes('500')) {
      console.log('❌ 500 Internal Server Error - This is the real issue!');
    } else {
      console.log('✅ Expected auth error:', error.message);
    }
  }
  
  // Scenario 2: Empty Bearer token
  console.log('\n📋 Scenario 2: Empty Bearer Token');
  try {
    const response = await makeExactRequest(url, 'POST', requestData, 'Bearer ');
    console.log('❌ Unexpected success');
  } catch (error) {
    if (error.message.includes('500')) {
      console.log('❌ 500 Internal Server Error - This is the real issue!');
    } else {
      console.log('✅ Expected auth error:', error.message);
    }
  }
  
  // Scenario 3: Invalid Bearer token
  console.log('\n📋 Scenario 3: Invalid Bearer Token');
  try {
    const response = await makeExactRequest(url, 'POST', requestData, 'Bearer invalid-token');
    console.log('❌ Unexpected success');
  } catch (error) {
    if (error.message.includes('500')) {
      console.log('❌ 500 Internal Server Error - This is the real issue!');
    } else {
      console.log('✅ Expected auth error:', error.message);
    }
  }
}

// Test if there's a specific issue with the request format
async function testRequestFormatIssues() {
  console.log('\n📋 Testing Request Format Issues\n');
  
  const url = 'https://lyfe-production.up.railway.app/api/journal/entries';
  
  // Test with minimal data
  console.log('📋 Test 1: Minimal Data');
  try {
    const response = await makeExactRequest(url, 'POST', {
      title: 'Test',
      content: 'Test content'
    });
    console.log('❌ Unexpected success');
  } catch (error) {
    if (error.message.includes('500')) {
      console.log('❌ 500 error with minimal data');
    } else {
      console.log('✅ Expected auth error:', error.message);
    }
  }
  
  // Test with full data
  console.log('\n📋 Test 2: Full Data');
  try {
    const response = await makeExactRequest(url, 'POST', {
      title: 'Test Entry',
      content: 'This is a test journal entry',
      type: 'daily',
      mood: 'neutral',
      tags: [],
      isPrivate: false,
      mindfulnessDimensions: {
        presence: { rating: 0 },
        emotionAwareness: { rating: 0 },
        intentionality: { rating: 0 },
        attentionQuality: { rating: 0 },
        compassion: { rating: 0 }
      }
    });
    console.log('❌ Unexpected success');
  } catch (error) {
    if (error.message.includes('500')) {
      console.log('❌ 500 error with full data');
    } else {
      console.log('✅ Expected auth error:', error.message);
    }
  }
  
  // Test with invalid data
  console.log('\n📋 Test 3: Invalid Data (Missing Title)');
  try {
    const response = await makeExactRequest(url, 'POST', {
      content: 'Content without title'
    });
    console.log('❌ Unexpected success');
  } catch (error) {
    if (error.message.includes('500')) {
      console.log('❌ 500 error with invalid data');
    } else if (error.message.includes('400')) {
      console.log('✅ Expected validation error:', error.message);
    } else {
      console.log('✅ Expected auth error:', error.message);
    }
  }
}

// Helper function to make exact HTTP requests
function makeExactRequest(url, method = 'GET', data = null, authToken = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
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

// Check if there's a timing issue or specific condition
async function testTimingAndConditions() {
  console.log('\n⏰ Testing Timing and Conditions\n');
  
  // Test multiple requests in sequence
  console.log('📋 Testing Multiple Sequential Requests');
  for (let i = 1; i <= 3; i++) {
    console.log(`Request ${i}:`);
    try {
      const response = await makeExactRequest('https://lyfe-production.up.railway.app/api/journal/entries', 'POST', {
        title: `Test ${i}`,
        content: `Test content ${i}`
      });
      console.log('❌ Unexpected success');
    } catch (error) {
      if (error.message.includes('500')) {
        console.log('❌ 500 error on request', i);
      } else {
        console.log('✅ Expected auth error');
      }
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Main function
async function main() {
  console.log('🚀 Exact Frontend Request Test\n');
  
  await testExactFrontendRequest();
  await testWithDifferentAuthScenarios();
  await testRequestFormatIssues();
  await testTimingAndConditions();
  
  console.log('\n📋 Final Diagnosis:');
  console.log('If you see 500 errors in any of the above tests, then:');
  console.log('1. The backend is actually returning 500 errors');
  console.log('2. Our encryption fix is not working');
  console.log('3. There is a different server issue');
  console.log('4. The deployment did not include our fixes');
  
  console.log('\n🔧 If 500 errors are confirmed:');
  console.log('1. Check Railway deployment logs immediately');
  console.log('2. Verify commit 249a70f6 is actually deployed');
  console.log('3. Check Railway environment variables');
  console.log('4. Look for specific error messages in server logs');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}
