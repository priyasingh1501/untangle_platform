#!/usr/bin/env node

// Test WhatsApp Bot Database Error Handling
const fetch = require('node-fetch');

async function testWhatsAppDbError() {
  console.log('🔍 Testing WhatsApp Bot Database Error Handling');
  console.log('==============================================\n');

  const webhookUrl = 'https://lyfe-production.up.railway.app/api/whatsapp/webhook';
  
  const testPhoneNumber = '919805153470';
  const testEmail = 'priya99920@gmail.com';
  const testPassword = 'Priya@123';

  try {
    // Test with a known working account
    console.log('📱 Test 1: Testing with known working account');
    await sendWhatsAppMessage(webhookUrl, testPhoneNumber, `login ${testEmail} ${testPassword}`);
    await sleep(3000);

    // Test with a different working account
    console.log('\n📱 Test 2: Testing with different working account');
    await sendWhatsAppMessage(webhookUrl, testPhoneNumber, 'login priya1@gmail.com Priya@123');
    await sleep(3000);

    // Test with another working account
    console.log('\n📱 Test 3: Testing with another working account');
    await sendWhatsAppMessage(webhookUrl, testPhoneNumber, 'login aaa@gmail.com Priya@123');
    await sleep(3000);

    console.log('\n✅ Tests completed!');
    console.log('\n💡 Check your WhatsApp for responses.');
    console.log('If ALL accounts fail with "Invalid password", there might be:');
    console.log('1. Database connection issue in WhatsApp bot');
    console.log('2. Different database being used');
    console.log('3. Password hashing issue in WhatsApp context');
    console.log('4. Error in the authentication flow');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function sendWhatsAppMessage(webhookUrl, phoneNumber, messageText) {
  try {
    const webhookPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'db_error_test',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15556324225',
              phone_number_id: '796369900227467'
            },
            messages: [{
              from: phoneNumber,
              id: 'db_test_' + Date.now(),
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
testWhatsAppDbError().catch(console.error);
