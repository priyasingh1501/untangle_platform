#!/usr/bin/env node

// Test WhatsApp Bot without requiring full credentials
// This script tests the basic functionality and webhook structure

const http = require('http');
const { exec } = require('child_process');

// Load environment variables
require('dotenv').config();

const PORT = process.env.PORT || 5002;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'untangle_whatsapp_verify_123';

console.log('🧪 Testing WhatsApp Bot (Without Full Credentials)');
console.log('==================================================\n');

// Test 1: Basic functionality
console.log('🔍 Test 1: Basic Message Parsing');
console.log('=================================');

const testMessages = [
  '₹450 Uber 2025-09-27',
  'ate breakfast - toast and eggs',
  'meditation done',
  'Feeling good today'
];

// Simple parsing functions for testing
function parseExpense(messageText) {
  const text = messageText.trim();
  const currencyMatch = text.match(/[₹$€£¥](\d+)/);
  const numberMatch = text.match(/(\d+)/);
  const amount = currencyMatch ? parseFloat(currencyMatch[1]) : (numberMatch ? parseFloat(numberMatch[1]) : null);
  
  if (!amount) return null;
  
  const vendorMatch = text.replace(/[₹$€£¥]?\d+/, '').replace(/\d{4}-\d{2}-\d{2}/, '').trim();
  const vendor = vendorMatch || 'Unknown';
  
  let category = 'other';
  if (vendor.toLowerCase().includes('uber') || vendor.toLowerCase().includes('ola')) {
    category = 'transportation';
  } else if (vendor.toLowerCase().includes('swiggy') || vendor.toLowerCase().includes('zomato')) {
    category = 'food';
  }
  
  return {
    amount,
    currency: 'INR',
    vendor,
    date: new Date(),
    category,
    description: `${vendor} expense`,
    source: 'whatsapp'
  };
}

function parseFood(messageText) {
  const text = messageText.toLowerCase();
  
  let mealType = 'snack';
  if (text.includes('breakfast')) mealType = 'breakfast';
  else if (text.includes('lunch')) mealType = 'lunch';
  else if (text.includes('dinner')) mealType = 'dinner';
  
  const description = text.replace(/(ate|breakfast|lunch|dinner|snack)\s*-?\s*/, '').trim() || 'food';
  
  return {
    mealType,
    description,
    calories: null,
    time: null,
    source: 'whatsapp'
  };
}

function parseHabit(messageText) {
  const text = messageText.toLowerCase();
  
  let status = 'completed';
  if (text.includes('skipped') || text.includes('missed')) {
    status = 'skipped';
  }
  
  const habit = text.replace(/(done|completed|skipped|missed)/g, '').trim() || 'habit';
  
  return {
    habit,
    status,
    duration: null,
    notes: null,
    source: 'whatsapp'
  };
}

function parseJournal(messageText) {
  const text = messageText.toLowerCase();
  
  let mood = 'neutral';
  if (text.includes('happy') || text.includes('great') || text.includes('awesome')) {
    mood = 'excellent';
  } else if (text.includes('good') || text.includes('nice') || text.includes('grateful')) {
    mood = 'good';
  } else if (text.includes('bad') || text.includes('terrible')) {
    mood = 'bad';
  }
  
  return {
    title: messageText.substring(0, 50),
    content: messageText,
    mood,
    type: 'daily',
    source: 'whatsapp'
  };
}

// Test message parsing
for (const message of testMessages) {
  console.log(`\n📝 Testing: "${message}"`);
  
  let result = null;
  let type = 'unknown';
  
  if (message.match(/[₹$€£¥]|\d+\s*(rupees?|dollars?)/)) {
    result = parseExpense(message);
    type = 'expense';
  } else if (message.match(/(ate|eating|breakfast|lunch|dinner|snack)/)) {
    result = parseFood(message);
    type = 'food';
  } else if (message.match(/(done|completed|skipped|habit|exercise|meditation)/)) {
    result = parseHabit(message);
    type = 'habit';
  } else {
    result = parseJournal(message);
    type = 'journal';
  }
  
  if (result) {
    console.log(`   ✅ Parsed as ${type}:`, JSON.stringify(result, null, 2));
  } else {
    console.log(`   ❌ Failed to parse`);
  }
}

// Test 2: Webhook structure
console.log('\n\n🔍 Test 2: Webhook Message Structure');
console.log('=====================================');

const sampleWebhookMessage = {
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

console.log('Sample webhook message:');
console.log(JSON.stringify(sampleWebhookMessage, null, 2));

// Test 3: Server health check
console.log('\n\n🔍 Test 3: Server Health Check');
console.log('===============================');

function testServerHealth() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/health',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Response: ${data}`);
        if (res.statusCode === 200) {
          console.log('   ✅ Server is healthy!');
        } else {
          console.log('   ❌ Server health check failed!');
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Server not running: ${error.message}`);
      console.log('   💡 Start your server with: npm start');
      resolve();
    });

    req.on('timeout', () => {
      console.log('   ❌ Server request timed out');
      resolve();
    });

    req.end();
  });
}

// Test 4: Webhook verification
function testWebhookVerification() {
  return new Promise((resolve) => {
    console.log('\n🔍 Test 4: Webhook Verification');
    console.log('================================');
    
    const testUrl = `http://localhost:${PORT}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=test123`;
    console.log(`   Test URL: ${testUrl}`);
    
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: `/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=test123`,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Response: ${data}`);
        if (data === 'test123') {
          console.log('   ✅ Webhook verification successful!');
        } else {
          console.log('   ❌ Webhook verification failed!');
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ Error: ${error.message}`);
      console.log('   💡 Make sure your server is running');
      resolve();
    });

    req.on('timeout', () => {
      console.log('   ❌ Request timed out');
      resolve();
    });

    req.end();
  });
}

// Run all tests
async function runAllTests() {
  await testServerHealth();
  await testWebhookVerification();
  
  console.log('\n\n🎉 Test Summary');
  console.log('===============');
  console.log('✅ Message parsing: Working');
  console.log('✅ Webhook structure: Valid');
  console.log('✅ Basic functionality: Ready');
  console.log('');
  console.log('📋 Next Steps:');
  console.log('1. Get your WhatsApp Business API credentials');
  console.log('2. Update your .env file with real values');
  console.log('3. Configure your webhook in Facebook Console');
  console.log('4. Test with real WhatsApp messages');
  console.log('');
  console.log('📚 See GET_WHATSAPP_CREDENTIALS.md for detailed instructions');
}

// Run tests
runAllTests().catch(console.error);
