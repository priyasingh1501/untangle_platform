#!/usr/bin/env node

// Test WhatsApp Bot with Working Web Accounts
const fetch = require('node-fetch');

async function testWhatsAppWorkingAccounts() {
  console.log('🧪 Testing WhatsApp Bot with Working Web Accounts');
  console.log('================================================\n');

  const webhookUrl = 'https://lyfe-production.up.railway.app/api/whatsapp/webhook';
  
  // Test with accounts that work on web platform
  const workingAccounts = [
    { email: 'priya1@gmail.com', password: 'Priya@123', phone: '919805153470' },
    { email: 'aaa@gmail.com', password: 'Priya@123', phone: '919805153470' },
    { email: 'priya99920@gmail.com', password: 'Priya@123', phone: '919805153470' }
  ];

  for (const account of workingAccounts) {
    try {
      console.log(`📧 Testing WhatsApp login: ${account.email}`);
      
      // Send login command
      await sendWhatsAppMessage(webhookUrl, account.phone, `login ${account.email} ${account.password}`);
      await sleep(3000);

      // Send status command
      await sendWhatsAppMessage(webhookUrl, account.phone, 'status');
      await sleep(2000);

      console.log(`✅ Completed test for ${account.email}\n`);
      
    } catch (error) {
      console.error(`❌ Error testing ${account.email}:`, error.message);
    }
  }

  console.log('✅ WhatsApp bot test completed!');
  console.log('\n💡 Check your WhatsApp for responses from all three accounts.');
  console.log('If all accounts fail, the issue is with WhatsApp bot authentication.');
  console.log('If some work, the issue might be account-specific.');
}

async function sendWhatsAppMessage(webhookUrl, phoneNumber, messageText) {
  try {
    const webhookPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'working_accounts_test',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15556324225',
              phone_number_id: '796369900227467'
            },
            messages: [{
              from: phoneNumber,
              id: 'working_test_' + Date.now(),
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
testWhatsAppWorkingAccounts().catch(console.error);
