#!/usr/bin/env node

// Webhook Tester for WhatsApp Bot
// This script helps you test your webhook configuration

const http = require('http');
const https = require('https');
const url = require('url');

// Load environment variables
require('dotenv').config();

const PORT = process.env.PORT || 5002;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'untangle_whatsapp_verify_123';

// Test webhook verification
function testWebhookVerification() {
  console.log('🧪 Testing Webhook Verification');
  console.log('===============================\n');

  const testUrl = `http://localhost:${PORT}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=test123`;
  
  console.log('Test URL:', testUrl);
  console.log('');

  const options = {
    hostname: 'localhost',
    port: PORT,
    path: `/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=test123`,
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response Status:', res.statusCode);
      console.log('Response Body:', data);
      
      if (data === 'test123') {
        console.log('✅ Webhook verification successful!');
      } else {
        console.log('❌ Webhook verification failed!');
        console.log('Make sure your server is running and the verify token matches.');
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Error testing webhook:', error.message);
    console.log('Make sure your server is running on port', PORT);
  });

  req.end();
}

// Test webhook message processing
function testWebhookMessage() {
  console.log('\n🧪 Testing Webhook Message Processing');
  console.log('=====================================\n');

  const testMessage = {
    object: 'whatsapp_business_account',
    entry: [{
      changes: [{
        value: {
          messages: [{
            from: '1234567890',
            text: { body: '₹450 Uber 2025-09-27' },
            type: 'text'
          }],
          metadata: {
            phone_number_id: '123456789012345'
          }
        },
        field: 'messages'
      }]
    }]
  };

  const postData = JSON.stringify(testMessage);
  
  const options = {
    hostname: 'localhost',
    port: PORT,
    path: '/api/whatsapp/webhook',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('Sending test message:', JSON.stringify(testMessage, null, 2));
  console.log('');

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response Status:', res.statusCode);
      console.log('Response Body:', data);
      
      if (res.statusCode === 200) {
        console.log('✅ Webhook message processing successful!');
      } else {
        console.log('❌ Webhook message processing failed!');
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Error testing webhook message:', error.message);
    console.log('Make sure your server is running on port', PORT);
  });

  req.write(postData);
  req.end();
}

// Test server health
function testServerHealth() {
  console.log('🏥 Testing Server Health');
  console.log('========================\n');

  const options = {
    hostname: 'localhost',
    port: PORT,
    path: '/health',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Health Check Status:', res.statusCode);
      console.log('Response Body:', data);
      
      if (res.statusCode === 200) {
        console.log('✅ Server is healthy!');
      } else {
        console.log('❌ Server health check failed!');
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Error checking server health:', error.message);
    console.log('Make sure your server is running on port', PORT);
  });

  req.end();
}

// Main test function
async function runTests() {
  console.log('🚀 WhatsApp Bot Webhook Tests');
  console.log('=============================\n');

  console.log('Environment Variables:');
  console.log('PORT:', PORT);
  console.log('VERIFY_TOKEN:', VERIFY_TOKEN);
  console.log('WHATSAPP_PHONE_NUMBER_ID:', process.env.WHATSAPP_PHONE_NUMBER_ID ? 'Set' : 'Not Set');
  console.log('WHATSAPP_ACCESS_TOKEN:', process.env.WHATSAPP_ACCESS_TOKEN ? 'Set' : 'Not Set');
  console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set' : 'Not Set');
  console.log('');

  // Test server health first
  testServerHealth();
  
  // Wait a bit for server health check
  setTimeout(() => {
    // Test webhook verification
    testWebhookVerification();
    
    // Wait a bit for webhook verification test
    setTimeout(() => {
      // Test webhook message processing
      testWebhookMessage();
    }, 1000);
  }, 1000);
}

// Run tests
runTests().catch(console.error);
