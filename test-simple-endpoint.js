#!/usr/bin/env node

/**
 * Simple Endpoint Test
 * 
 * This script tests a simple endpoint to isolate the issue
 */

const https = require('https');

// Test a simple endpoint that doesn't require encryption
async function testSimpleEndpoint() {
  console.log('🔍 Testing Simple Endpoint (No Encryption Required)\n');
  
  try {
    const response = await makeRequest('/api/health');
    console.log('✅ Health endpoint working:', response);
  } catch (error) {
    console.log('❌ Health endpoint failed:', error.message);
  }
}

// Test if the issue is with the journal route specifically
async function testJournalRouteOnly() {
  console.log('\n📝 Testing Journal Route (GET - No Encryption)\n');
  
  try {
    const response = await makeRequest('/api/journal');
    console.log('❌ Unexpected success without auth');
  } catch (error) {
    if (error.message.includes('500')) {
      console.log('❌ 500 error on journal route - route itself is broken');
    } else if (error.message.includes('401') || error.message.includes('No token')) {
      console.log('✅ Journal route working (requires auth)');
    } else {
      console.log('❓ Unexpected error:', error.message);
    }
  }
}

// Test if the issue is specifically with POST requests
async function testPostRequest() {
  console.log('\n📤 Testing POST Request (Minimal Data)\n');
  
  try {
    const response = await makeRequest('/api/journal/entries', 'POST', {
      title: 'Minimal Test',
      content: 'Minimal content'
    });
    console.log('❌ Unexpected success without auth');
  } catch (error) {
    if (error.message.includes('500')) {
      console.log('❌ 500 error on POST request - POST handling is broken');
    } else if (error.message.includes('401') || error.message.includes('No token')) {
      console.log('✅ POST request working (requires auth)');
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
        'User-Agent': 'Simple-Test/1.0'
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
  console.log('🚀 Simple Endpoint Test\n');
  
  await testSimpleEndpoint();
  await testJournalRouteOnly();
  await testPostRequest();
  
  console.log('\n📋 Analysis:');
  console.log('If all tests show 401 errors, the routes are working correctly.');
  console.log('If any test shows 500 errors, that specific part is broken.');
  console.log('\n🔧 Next: Check Railway logs for specific error details.');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}
