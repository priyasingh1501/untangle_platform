#!/usr/bin/env node

// Debug WhatsApp Authentication Flow Step by Step
const fetch = require('node-fetch');

async function debugWhatsAppAuthFlow() {
  console.log('🔍 Debugging WhatsApp Authentication Flow');
  console.log('========================================\n');

  const webhookUrl = 'https://lyfe-production.up.railway.app/api/whatsapp/webhook';
  
  const testPhoneNumber = '919805153470';
  const testEmail = 'priya99920@gmail.com';
  const testPassword = 'Priya@123';

  console.log(`📱 Phone: ${testPhoneNumber}`);
  console.log(`📧 Email: ${testEmail}`);
  console.log(`🔑 Password: ${testPassword}`);
  console.log('');

  try {
    // Test 1: Check current status
    console.log('📱 Test 1: Checking current authentication status');
    await sendMessage(webhookUrl, testPhoneNumber, 'status');
    await sleep(2000);

    // Test 2: Try login with exact credentials
    console.log('\n📱 Test 2: Attempting login');
    await sendMessage(webhookUrl, testPhoneNumber, `login ${testEmail} ${testPassword}`);
    await sleep(3000);

    // Test 3: Check status after login attempt
    console.log('\n📱 Test 3: Checking status after login attempt');
    await sendMessage(webhookUrl, testPhoneNumber, 'status');
    await sleep(2000);

    // Test 4: Try with different email format (lowercase)
    console.log('\n📱 Test 4: Trying with lowercase email');
    await sendMessage(webhookUrl, testPhoneNumber, `login ${testEmail.toLowerCase()} ${testPassword}`);
    await sleep(3000);

    // Test 5: Check status again
    console.log('\n📱 Test 5: Final status check');
    await sendMessage(webhookUrl, testPhoneNumber, 'status');
    await sleep(2000);

    console.log('\n✅ Debug flow completed!');
    console.log('\n💡 Please check your WhatsApp for responses and tell me:');
    console.log('1. What was the response to the login command?');
    console.log('2. What was the response to the status commands?');
    console.log('3. Did any of the login attempts work?');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

async function sendMessage(webhookUrl, phoneNumber, messageText) {
  try {
    const webhookPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'debug_auth_entry',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15556324225',
              phone_number_id: '796369900227467'
            },
            messages: [{
              from: phoneNumber,
              id: 'debug_auth_' + Date.now(),
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

// Run the debug
debugWhatsAppAuthFlow().catch(console.error);
