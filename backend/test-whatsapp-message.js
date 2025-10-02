#!/usr/bin/env node

// Test WhatsApp message processing
const fetch = require('node-fetch');

async function testWhatsAppMessage() {
  console.log('🧪 Testing WhatsApp Message Processing');
  console.log('=====================================\n');

  const webhookUrl = 'http://localhost:5002/api/whatsapp/webhook';
  
  // Simulate a WhatsApp message payload
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
    console.log('📱 Sending test message: "help"');
    console.log('📞 From phone: +15551234567');
    console.log('');

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testMessage)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Webhook response:', result);
      console.log('');
      console.log('💡 Check server logs for message processing details');
    } else {
      console.log('❌ Webhook failed:', response.status, response.statusText);
      const error = await response.text();
      console.log('Error details:', error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test
testWhatsAppMessage();
