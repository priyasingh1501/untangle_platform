#!/usr/bin/env node

// Test Correct Webhook Structure
const fetch = require('node-fetch');

async function testCorrectWebhook() {
  console.log('🔍 Testing Correct Webhook Structure');
  console.log('====================================\n');

  const webhookUrl = 'https://lyfe-production.up.railway.app/api/whatsapp/webhook';
  const testPhoneNumber = '919805153470';

  try {
    // Test with correct webhook structure for incoming messages
    console.log('📱 Test: Sending message with correct webhook structure');
    await sendCorrectWebhookMessage(webhookUrl, testPhoneNumber, 'login priya99920@gmail.com Priya@123');
    
    console.log('\n✅ Test completed!');
    console.log('\n💡 Check Railway logs for:');
    console.log('1. "Found 1 messages to process"');
    console.log('2. Authentication logging: "Looking for user with email"');
    console.log('3. User found status and details');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function sendCorrectWebhookMessage(webhookUrl, phoneNumber, messageText) {
  try {
    const webhookPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'correct_webhook_test',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15556324225',
              phone_number_id: '796369900227467'
            },
            messages: [{
              from: phoneNumber,
              id: 'correct_webhook_' + Date.now(),
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
    console.log(`📤 Webhook structure: messages array (not statuses)`);

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

// Run the test
testCorrectWebhook().catch(console.error);
