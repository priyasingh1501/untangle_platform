#!/usr/bin/env node

// Final Debug WhatsApp Authentication
const fetch = require('node-fetch');

async function debugWhatsAppFinal() {
  console.log('🔍 Final Debug WhatsApp Authentication');
  console.log('=====================================\n');

  const webhookUrl = 'https://lyfe-production.up.railway.app/api/whatsapp/webhook';
  
  const testPhoneNumber = '919805153470';
  const testEmail = 'priya99920@gmail.com';
  const testPassword = 'Priya@123';

  try {
    // Test 1: Send login command and check for any new error messages
    console.log('📱 Test 1: Testing login with database connection fix');
    await sendWhatsAppMessage(webhookUrl, testPhoneNumber, `login ${testEmail} ${testPassword}`);
    await sleep(3000);

    // Test 2: Try with a simple message to see if bot responds
    console.log('\n📱 Test 2: Testing simple message');
    await sendWhatsAppMessage(webhookUrl, testPhoneNumber, 'hello');
    await sleep(2000);

    // Test 3: Try with a different account
    console.log('\n📱 Test 3: Testing with different account');
    await sendWhatsAppMessage(webhookUrl, testPhoneNumber, 'login priya1@gmail.com Priya@123');
    await sleep(3000);

    console.log('\n✅ Tests completed!');
    console.log('\n💡 Check your WhatsApp for responses.');
    console.log('If login still fails, the issue might be:');
    console.log('1. Railway is still running old code');
    console.log('2. There\'s a different authentication function being called');
    console.log('3. Database connection is still not working');
    console.log('4. There\'s an error in the authentication flow');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function sendWhatsAppMessage(webhookUrl, phoneNumber, messageText) {
  try {
    const webhookPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'final_debug_test',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15556324225',
              phone_number_id: '796369900227467'
            },
            messages: [{
              from: phoneNumber,
              id: 'final_debug_' + Date.now(),
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
debugWhatsAppFinal().catch(console.error);
