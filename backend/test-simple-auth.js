#!/usr/bin/env node

// Test Simple Authentication
const fetch = require('node-fetch');

async function testSimpleAuth() {
  console.log('🔍 Testing Simple Authentication');
  console.log('================================\n');

  const webhookUrl = 'https://lyfe-production.up.railway.app/api/whatsapp/webhook';
  const testPhoneNumber = '919805153470';

  try {
    // Test 1: Simple hello message
    console.log('📱 Test 1: Simple hello message');
    await sendWhatsAppMessage(webhookUrl, testPhoneNumber, 'hello');
    await sleep(2000);

    // Test 2: Status check
    console.log('\n📱 Test 2: Status check');
    await sendWhatsAppMessage(webhookUrl, testPhoneNumber, 'status');
    await sleep(2000);

    // Test 3: Login with different account
    console.log('\n📱 Test 3: Login with different account');
    await sendWhatsAppMessage(webhookUrl, testPhoneNumber, 'login priya1@gmail.com Priya@123');
    await sleep(3000);

    console.log('\n✅ All tests completed!');
    console.log('\n💡 Check your WhatsApp for responses.');
    console.log('This will help us determine if the issue is:');
    console.log('1. Account-specific (priya99920@gmail.com)');
    console.log('2. General authentication issue');
    console.log('3. Specific to the login command');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function sendWhatsAppMessage(webhookUrl, phoneNumber, messageText) {
  try {
    const webhookPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'simple_auth_test',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15556324225',
              phone_number_id: '796369900227467'
            },
            messages: [{
              from: phoneNumber,
              id: 'simple_auth_' + Date.now(),
              timestamp: Math.floor(Date.now() / 1000).toString(),
              text: {
                body: messageText
              },
              type: 'text'
            }]
          },
          field: 'messages'
        }]
      }]
    };

    console.log(`📤 Sending: "${messageText}"`);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });

    const result = await response.json();
    console.log(`📥 Response: ${JSON.stringify(result)}`);
    
    if (!response.ok) {
      console.log(`❌ HTTP ${response.status}: ${response.statusText}`);
    }

  } catch (error) {
    console.error(`❌ Error sending "${messageText}":`, error.message);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the test
testSimpleAuth().catch(console.error);
