#!/usr/bin/env node

/**
 * Test Frontend Request Simulation
 * 
 * This script simulates the exact request the frontend is making to identify the issue
 */

const https = require('https');

const PRODUCTION_URL = 'https://lyfe-production.up.railway.app';

// Simulate the exact frontend request
async function simulateFrontendRequest() {
  console.log('🔍 Simulating Frontend Journal Entry Request\n');
  
  // This is the exact request format from Journal.jsx:211
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
    const response = await makeRequest('/api/journal/entries', 'POST', requestData);
    console.log('✅ Request successful:', response);
  } catch (error) {
    console.log('❌ Request failed:', error.message);
    
    // Analyze the error
    if (error.message.includes('No token') || error.message.includes('authorization denied')) {
      console.log('🔍 Issue: Missing or invalid authentication token');
      console.log('💡 Solution: Check if user is properly logged in');
    } else if (error.message.includes('500')) {
      console.log('🔍 Issue: Server error - likely encryption or database issue');
      console.log('💡 Solution: Check server logs for specific error');
    } else if (error.message.includes('400')) {
      console.log('🔍 Issue: Bad request - likely validation error');
      console.log('💡 Solution: Check request data format');
    } else {
      console.log('🔍 Issue: Unknown error');
      console.log('💡 Solution: Check network connectivity and server status');
    }
  }
}

// Test with different scenarios
async function testDifferentScenarios() {
  console.log('\n🧪 Testing Different Scenarios\n');
  
  // Scenario 1: Minimal request
  console.log('📋 Scenario 1: Minimal Request');
  try {
    const response = await makeRequest('/api/journal/entries', 'POST', {
      title: 'Minimal Test',
      content: 'Minimal content'
    });
    console.log('✅ Minimal request successful');
  } catch (error) {
    console.log('❌ Minimal request failed:', error.message);
  }
  
  // Scenario 2: Request with all optional fields
  console.log('\n📋 Scenario 2: Full Request');
  try {
    const response = await makeRequest('/api/journal/entries', 'POST', {
      title: 'Full Test',
      content: 'Full content test',
      type: 'daily',
      mood: 'neutral',
      tags: ['test', 'debug'],
      isPrivate: true,
      location: { city: 'Test City' },
      weather: { temperature: 25, condition: 'sunny' }
    });
    console.log('✅ Full request successful');
  } catch (error) {
    console.log('❌ Full request failed:', error.message);
  }
  
  // Scenario 3: Invalid request (missing required fields)
  console.log('\n📋 Scenario 3: Invalid Request (Missing Title)');
  try {
    const response = await makeRequest('/api/journal/entries', 'POST', {
      content: 'Content without title'
    });
    console.log('✅ Invalid request handled correctly');
  } catch (error) {
    if (error.message.includes('400') || error.message.includes('required')) {
      console.log('✅ Invalid request properly rejected:', error.message);
    } else {
      console.log('❌ Unexpected error for invalid request:', error.message);
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
        'User-Agent': 'Frontend-Simulation/1.0'
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

// Check if the issue is authentication-related
async function checkAuthenticationIssue() {
  console.log('\n🔐 Checking Authentication Issue\n');
  
  // Test if we can get user info (this would require valid auth)
  try {
    const response = await makeRequest('/api/auth/me');
    console.log('✅ Auth endpoint accessible:', response);
  } catch (error) {
    if (error.message.includes('No token')) {
      console.log('✅ Auth endpoint requires token (expected)');
    } else {
      console.log('❓ Auth endpoint error:', error.message);
    }
  }
  
  // Test journal endpoint specifically
  try {
    const response = await makeRequest('/api/journal');
    console.log('✅ Journal endpoint accessible:', response);
  } catch (error) {
    if (error.message.includes('No token')) {
      console.log('✅ Journal endpoint requires token (expected)');
    } else {
      console.log('❓ Journal endpoint error:', error.message);
    }
  }
}

// Main function
async function main() {
  console.log('🚀 Frontend Request Simulation Test\n');
  
  await simulateFrontendRequest();
  await testDifferentScenarios();
  await checkAuthenticationIssue();
  
  console.log('\n📋 Analysis Summary:');
  console.log('If all requests return "No token" errors, the backend is working correctly.');
  console.log('The issue is likely in the frontend:');
  console.log('1. User not properly authenticated');
  console.log('2. Token expired or invalid');
  console.log('3. Token not being sent in request headers');
  console.log('4. CORS issues preventing proper authentication');
  
  console.log('\n🔧 Frontend Debugging Steps:');
  console.log('1. Check browser developer tools → Network tab');
  console.log('2. Verify Authorization header is being sent');
  console.log('3. Check if token is valid and not expired');
  console.log('4. Verify user is logged in properly');
  console.log('5. Check for CORS errors in console');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}
