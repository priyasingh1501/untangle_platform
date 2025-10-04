#!/usr/bin/env node

// Test if our authentication changes are deployed
const fetch = require('node-fetch');

async function testDeploymentStatus() {
  console.log('🔍 Testing if Authentication Changes are Deployed');
  console.log('================================================\n');

  const webhookUrl = 'https://lyfe-production.up.railway.app/api/whatsapp/webhook';
  
  const testPhoneNumber = '919805153470';
  const testEmail = 'priya99920@gmail.com';
  const testPassword = 'Priya@123';

  console.log('🧪 Testing with credentials that work on web platform:');
  console.log(`📧 Email: ${testEmail}`);
  console.log(`🔑 Password: ${testPassword}`);
  console.log('');

  try {
    // Test login command
    console.log('📱 Sending login command...');
    await sendMessage(webhookUrl, testPhoneNumber, `login ${testEmail} ${testPassword}`);
    await sleep(3000);

    console.log('\n✅ Test completed!');
    console.log('\n💡 Check your WhatsApp for the response.');
    console.log('If you see "invalid password" or "not logged in", then Railway');
    console.log('has NOT deployed our authentication fixes yet.');
    console.log('');
    console.log('If you see "Welcome back, Priya!" then the fixes are deployed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function sendMessage(webhookUrl, phoneNumber, messageText) {
  try {
    const webhookPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'deployment_test_entry',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15556324225',
              phone_number_id: '796369900227467'
            },
            messages: [{
              from: phoneNumber,
              id: 'deployment_test_' + Date.now(),
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
testDeploymentStatus().catch(console.error);
