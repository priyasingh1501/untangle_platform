#!/usr/bin/env node

// Detailed WhatsApp Bot Test
const fetch = require('node-fetch');

async function testWhatsAppDetailed() {
  console.log('🔍 Detailed WhatsApp Bot Test');
  console.log('=============================\n');

  const webhookUrl = 'https://lyfe-production.up.railway.app/api/whatsapp/webhook';
  
  const testPhoneNumber = '919805153470';
  const testEmail = 'priya99920@gmail.com';
  const testPassword = 'Priya@123';

  console.log(`📱 Testing with phone: ${testPhoneNumber}`);
  console.log(`📧 Email: ${testEmail}`);
  console.log(`🔑 Password: ${testPassword}`);
  console.log('');

  try {
    // Test 1: Simple hello message
    console.log('📱 Test 1: Sending hello message');
    await sendMessage(webhookUrl, testPhoneNumber, 'hello');
    await sleep(3000);

    // Test 2: Login command
    console.log('\n📱 Test 2: Sending login command');
    await sendMessage(webhookUrl, testPhoneNumber, `login ${testEmail} ${testPassword}`);
    await sleep(3000);

    // Test 3: Status check
    console.log('\n📱 Test 3: Checking status');
    await sendMessage(webhookUrl, testPhoneNumber, 'status');
    await sleep(3000);

    // Test 4: Try expense logging
    console.log('\n📱 Test 4: Testing expense logging');
    await sendMessage(webhookUrl, testPhoneNumber, '₹450 Uber');
    await sleep(3000);

    // Test 5: Logout
    console.log('\n📱 Test 5: Logging out');
    await sendMessage(webhookUrl, testPhoneNumber, 'logout');
    await sleep(2000);

    console.log('\n✅ Detailed test completed!');
    console.log('\n💡 Check your WhatsApp app for responses from the bot.');
    console.log('If you don\'t see any responses, the issue might be:');
    console.log('1. WhatsApp webhook is not properly configured');
    console.log('2. WhatsApp Business API is not sending responses');
    console.log('3. The bot is processing but not sending replies');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function sendMessage(webhookUrl, phoneNumber, messageText) {
  try {
    const webhookPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'detailed_test_entry',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15556324225',
              phone_number_id: '796369900227467'
            },
            messages: [{
              from: phoneNumber,
              id: 'detailed_test_' + Date.now(),
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
    console.log(`📥 Webhook Response: ${JSON.stringify(result)}`);
    
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
testWhatsAppDetailed().catch(console.error);
