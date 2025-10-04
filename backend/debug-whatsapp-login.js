#!/usr/bin/env node

// Debug WhatsApp Bot Login Issue
const fetch = require('node-fetch');

async function debugWhatsAppLogin() {
  console.log('🔍 Debugging WhatsApp Bot Login Issue');
  console.log('=====================================\n');

  const webhookUrl = 'https://lyfe-production.up.railway.app/api/whatsapp/webhook';
  
  // Test with your actual credentials - UPDATE THESE
  const testPhoneNumber = '919805153470'; // Your actual phone number
  const testEmail = 'your-email@example.com'; // Your actual email
  const testPassword = 'your-actual-password'; // Your actual password

  console.log('⚠️  UPDATE THE CREDENTIALS IN THIS SCRIPT WITH YOUR REAL ONES!');
  console.log(`📱 Phone: ${testPhoneNumber}`);
  console.log(`📧 Email: ${testEmail}`);
  console.log(`🔑 Password: ${testPassword}`);
  console.log('');

  try {
    // Test 1: Check if webhook is receiving messages
    console.log('📱 Test 1: Sending simple message to test webhook');
    await sendWhatsAppMessage(webhookUrl, testPhoneNumber, 'hello');
    await sleep(2000);

    // Test 2: Try login with credentials
    console.log('\n📱 Test 2: Attempting login');
    await sendWhatsAppMessage(webhookUrl, testPhoneNumber, `login ${testEmail} ${testPassword}`);
    await sleep(3000);

    // Test 3: Check status
    console.log('\n📱 Test 3: Checking authentication status');
    await sendWhatsAppMessage(webhookUrl, testPhoneNumber, 'status');
    await sleep(2000);

    // Test 4: Try with different email format
    console.log('\n📱 Test 4: Trying with lowercase email');
    await sendWhatsAppMessage(webhookUrl, testPhoneNumber, `login ${testEmail.toLowerCase()} ${testPassword}`);
    await sleep(3000);

    // Test 5: Check status again
    console.log('\n📱 Test 5: Checking status again');
    await sendWhatsAppMessage(webhookUrl, testPhoneNumber, 'status');
    await sleep(2000);

    console.log('\n✅ Debug tests completed!');
    console.log('\n💡 Check the responses above for error messages.');
    console.log('Common issues:');
    console.log('   - Email not found in database');
    console.log('   - Password incorrect');
    console.log('   - Account locked');
    console.log('   - Account inactive');
    console.log('   - 2FA enabled');
    console.log('   - Database connection issues');

  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
  }
}

async function sendWhatsAppMessage(webhookUrl, phoneNumber, messageText) {
  try {
    const webhookPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'debug_entry_id',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15556324225',
              phone_number_id: '796369900227467'
            },
            messages: [{
              from: phoneNumber,
              id: 'debug_message_id_' + Date.now(),
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

    console.log(`📤 Sending: "${messageText}" to ${phoneNumber}`);

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

// Run the debug
debugWhatsAppLogin().catch(console.error);
