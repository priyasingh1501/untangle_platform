#!/usr/bin/env node

// Test WhatsApp Bot After Deployment
const fetch = require('node-fetch');

async function testWhatsAppAfterDeployment() {
  console.log('🔍 Testing WhatsApp Bot After Deployment');
  console.log('=======================================\n');

  const webhookUrl = 'https://lyfe-production.up.railway.app/api/whatsapp/webhook';
  const testPhoneNumber = '919805153470';
  const testEmail = 'priya99920@gmail.com';
  const testPassword = 'Priya@123';

  try {
    // Test 1: Simple message first
    console.log('📱 Test 1: Testing simple message');
    await sendWhatsAppMessage(webhookUrl, testPhoneNumber, 'hello');
    await sleep(2000);

    // Test 2: Login with detailed logging
    console.log('\n📱 Test 2: Testing login with detailed logging');
    await sendWhatsAppMessage(webhookUrl, testPhoneNumber, `login ${testEmail} ${testPassword}`);
    await sleep(3000);

    console.log('\n✅ Tests completed!');
    console.log('\n💡 Check your WhatsApp for responses.');
    console.log('If login still fails, check Railway logs for detailed password comparison info.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function sendWhatsAppMessage(webhookUrl, phoneNumber, messageText) {
  try {
    const webhookPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'post_deployment_test',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15556324225',
              phone_number_id: '796369900227467'
            },
            messages: [{
              from: phoneNumber,
              id: 'post_deploy_' + Date.now(),
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
testWhatsAppAfterDeployment().catch(console.error);
