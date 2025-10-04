#!/usr/bin/env node

/**
 * Debug Production Journal Entry Creation
 * 
 * This script helps debug the journal entry creation issue in production
 */

const https = require('https');

const PRODUCTION_URL = 'https://lyfe-production.up.railway.app';

// Test function to check if our encryption fix is deployed
async function testEncryptionFix() {
  console.log('🔍 Testing if encryption fix is deployed...\n');
  
  try {
    // Test the health endpoint first
    const healthResponse = await makeRequest('/api/health');
    console.log('✅ Health check passed:', healthResponse);
    
    // Test journal endpoint without auth (should get auth error, not encryption error)
    try {
      const journalResponse = await makeRequest('/api/journal/entries', 'POST', {
        title: 'Test Entry',
        content: 'This is a test journal entry',
        type: 'daily',
        mood: 'neutral'
      });
      console.log('❌ Unexpected success without auth:', journalResponse);
    } catch (error) {
      if (error.message.includes('No token') || error.message.includes('authorization denied')) {
        console.log('✅ Auth check working correctly - got expected auth error');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
}

// Test function to check encryption service status
async function testEncryptionService() {
  console.log('\n🔐 Testing encryption service status...\n');
  
  try {
    // Try to access a public endpoint that might reveal encryption status
    const response = await makeRequest('/api/health');
    
    // Check if the response contains any encryption-related information
    if (response.environment === 'production') {
      console.log('✅ Running in production environment');
    }
    
    console.log('📊 Server info:', {
      environment: response.environment,
      uptime: response.uptime,
      mongodb: response.mongodb
    });
    
  } catch (error) {
    console.error('❌ Failed to get server info:', error.message);
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
        'User-Agent': 'Debug-Script/1.0'
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
            reject(new Error(parsed.message || `HTTP ${res.statusCode}`));
          }
        } catch (e) {
          reject(new Error(`Invalid JSON response: ${body}`));
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
  console.log('🚀 Production Journal Debug Starting...\n');
  
  await testEncryptionFix();
  await testEncryptionService();
  
  console.log('\n📋 Next Steps:');
  console.log('1. Check Railway deployment logs for recent deployments');
  console.log('2. Verify ENCRYPTION_KEY is set in Railway environment variables');
  console.log('3. Check if the latest commit (249a70f6) has been deployed');
  console.log('4. Test with a valid authentication token if available');
  
  console.log('\n🔧 Manual Fix Steps:');
  console.log('1. Go to Railway dashboard');
  console.log('2. Check if latest deployment includes our encryption fixes');
  console.log('3. Add ENCRYPTION_KEY environment variable if missing');
  console.log('4. Redeploy if necessary');
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}
