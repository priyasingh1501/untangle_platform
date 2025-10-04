#!/usr/bin/env node

// Test Login With Detailed Logging
const fetch = require('node-fetch');

async function testLoginWithLogging() {
  console.log('🔍 Testing Login With Detailed Logging');
  console.log('======================================\n');

  const webhookUrl = 'https://lyfe-production.up.railway.app/api/whatsapp/webhook';
  const testPhoneNumber = '919805153470';
  const testEmail = 'priya99920@gmail.com';
  const testPassword = 'Priya@123';

  try {
    console.log('📱 Testing login with detailed logging');
    console.log(`📤 Command: "login ${testEmail} ${testPassword}"`);
    
    await sendWhatsAppMessage(webhookUrl, testPhoneNumber, `login ${testEmail} ${testPassword}`);
    
    console.log('\n✅ Test completed!');
    console.log('\n💡 Check your WhatsApp for the response.');
    console.log('📋 Check Railway logs for detailed password comparison info:');
    console.log('   - Input password details');
    console.log('   - Password length and type');
    console.log('   - user.comparePassword() result');
    console.log('   - bcrypt.compare() result');
    console.log('   - Any error messages');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function sendWhatsAppMessage(webhookUrl, phoneNumber, messageText) {
  try {
    const webhookPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'logging_test',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15556324225',
              phone_number_id: '796369900227467'
            },
            messages: [{
              from: phoneNumber,
              id: 'logging_test_' + Date.now(),
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
testLoginWithLogging().catch(console.error);
