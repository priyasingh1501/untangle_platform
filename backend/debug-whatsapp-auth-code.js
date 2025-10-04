#!/usr/bin/env node

// Debug WhatsApp Authentication Code Execution
const fetch = require('node-fetch');

async function debugWhatsAppAuthCode() {
  console.log('🔍 Debugging WhatsApp Authentication Code Execution');
  console.log('==================================================\n');

  const webhookUrl = 'https://lyfe-production.up.railway.app/api/whatsapp/webhook';
  
  const testPhoneNumber = '919805153470';
  const testEmail = 'priya99920@gmail.com';
  const testPassword = 'Priya@123';

  console.log(`📱 Phone: ${testPhoneNumber}`);
  console.log(`📧 Email: ${testEmail}`);
  console.log(`🔑 Password: ${testPassword}`);
  console.log('');

  try {
    // Test 1: Send a simple message to see if bot responds
    console.log('📱 Test 1: Sending simple message');
    await sendMessage(webhookUrl, testPhoneNumber, 'hello');
    await sleep(2000);

    // Test 2: Send login command with detailed logging
    console.log('\n📱 Test 2: Sending login command');
    await sendMessage(webhookUrl, testPhoneNumber, `login ${testEmail} ${testPassword}`);
    await sleep(3000);

    // Test 3: Send status command
    console.log('\n📱 Test 3: Checking status');
    await sendMessage(webhookUrl, testPhoneNumber, 'status');
    await sleep(2000);

    // Test 4: Try a different command to see if bot is processing messages
    console.log('\n📱 Test 4: Testing expense command');
    await sendMessage(webhookUrl, testPhoneNumber, '₹100 Test');
    await sleep(2000);

    console.log('\n✅ Debug completed!');
    console.log('\n💡 Check your WhatsApp for responses.');
    console.log('If you see NO responses at all, the issue might be:');
    console.log('1. WhatsApp Business API not sending responses');
    console.log('2. WhatsApp webhook not processing messages');
    console.log('3. Server errors in authentication code');
    console.log('');
    console.log('If you see responses but login fails, the issue is:');
    console.log('1. Authentication code still has bugs');
    console.log('2. Database connection issues');
    console.log('3. Password comparison problems');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

async function sendMessage(webhookUrl, phoneNumber, messageText) {
  try {
    const webhookPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'debug_auth_code_entry',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15556324225',
              phone_number_id: '796369900227467'
            },
            messages: [{
              from: phoneNumber,
              id: 'debug_auth_code_' + Date.now(),
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
debugWhatsAppAuthCode().catch(console.error);
