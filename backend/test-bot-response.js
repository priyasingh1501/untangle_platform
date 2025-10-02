#!/usr/bin/env node

// Test if bot is trying to send responses
const fetch = require('node-fetch');

async function testBotResponse() {
  console.log('🤖 Testing Bot Response');
  console.log('======================\n');

  const webhookUrl = 'http://localhost:5002/api/whatsapp/webhook';
  
  // Simulate a real WhatsApp message
  const testMessage = {
    object: 'whatsapp_business_account',
    entry: [{
      id: 'test_entry_id',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: {
            display_phone_number: '15556324225',
            phone_number_id: '796369900227467'
          },
          messages: [{
            from: '15551234567',
            id: 'test_message_id',
            timestamp: Math.floor(Date.now() / 1000).toString(),
            text: {
              body: 'help'
            },
            type: 'text'
          }]
        },
        field: 'messages'
      }]
    }]
  };

  try {
    console.log('📱 Sending "help" message...');
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testMessage)
    });

    if (response.ok) {
      console.log('✅ Message received by webhook');
      console.log('💡 The bot should now try to send a response');
      console.log('💡 If you see "Recipient phone number not in allowed list" errors, that means the bot is working but can\'t send to test numbers');
    } else {
      console.log('❌ Webhook failed:', response.status);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testBotResponse();
