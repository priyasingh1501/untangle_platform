#!/usr/bin/env node

// Test Current Deployment Status
const fetch = require('node-fetch');

async function testCurrentDeployment() {
  console.log('🔍 Testing Current Deployment Status');
  console.log('====================================\n');

  const webhookUrl = 'https://lyfe-production.up.railway.app/api/whatsapp/webhook';
  const testPhoneNumber = '919805153470';

  try {
    // Test 1: Simple message to check if server is responsive
    console.log('📱 Test 1: Simple hello message');
    await sendWhatsAppMessage(webhookUrl, testPhoneNumber, 'hello');
    await sleep(2000);

    // Test 2: Login to trigger authentication logging
    console.log('\n📱 Test 2: Login to trigger authentication logging');
    await sendWhatsAppMessage(webhookUrl, testPhoneNumber, 'login priya99920@gmail.com Priya@123');
    await sleep(3000);

    console.log('\n✅ Tests completed!');
    console.log('\n💡 Check your WhatsApp for responses.');
    console.log('📋 Check Railway logs for:');
    console.log('1. New commit hash: 4668ae3e...');
    console.log('2. Enhanced logging: "Looking for user with email"');
    console.log('3. User found status: "User found: YES/NO"');
    console.log('4. User details: "User details: ..."');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function sendWhatsAppMessage(webhookUrl, phoneNumber, messageText) {
  try {
    const webhookPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'deployment_test',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15556324225',
              phone_number_id: '796369900227467'
            },
            messages: [{
              from: phoneNumber,
              id: 'deploy_test_' + Date.now(),
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
testCurrentDeployment().catch(console.error);
