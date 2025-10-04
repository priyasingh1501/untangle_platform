#!/usr/bin/env node

// Debug WhatsApp Password Parsing
const fetch = require('node-fetch');

async function debugWhatsAppPasswordParsing() {
  console.log('🔍 Debug WhatsApp Password Parsing');
  console.log('===================================\n');

  const webhookUrl = 'https://lyfe-production.up.railway.app/api/whatsapp/webhook';
  const testPhoneNumber = '919805153470';

  try {
    // Test different password formats
    const testCases = [
      {
        name: 'Original format',
        command: 'login priya99920@gmail.com Priya@123'
      },
      {
        name: 'With quotes',
        command: 'login priya99920@gmail.com "Priya@123"'
      },
      {
        name: 'With single quotes',
        command: "login priya99920@gmail.com 'Priya@123'"
      },
      {
        name: 'Different spacing',
        command: 'login  priya99920@gmail.com  Priya@123  '
      },
      {
        name: 'Case sensitive email',
        command: 'login PRIYA99920@GMAIL.COM Priya@123'
      }
    ];

    for (const testCase of testCases) {
      console.log(`📱 Testing: ${testCase.name}`);
      console.log(`📤 Command: "${testCase.command}"`);
      
      await sendWhatsAppMessage(webhookUrl, testPhoneNumber, testCase.command);
      await sleep(2000);
      console.log('---');
    }

    console.log('\n✅ All tests completed!');
    console.log('💡 Check your WhatsApp for responses.');
    console.log('If any test succeeds, we\'ll know the issue is password parsing.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function sendWhatsAppMessage(webhookUrl, phoneNumber, messageText) {
  try {
    const webhookPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'password_parsing_test',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15556324225',
              phone_number_id: '796369900227467'
            },
            messages: [{
              from: phoneNumber,
              id: 'password_test_' + Date.now(),
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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the test
debugWhatsAppPasswordParsing().catch(console.error);
