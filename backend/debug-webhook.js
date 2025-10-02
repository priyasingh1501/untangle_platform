#!/usr/bin/env node

// Debug webhook processing
const fetch = require('node-fetch');

async function debugWebhook() {
  console.log('🔍 Debugging WhatsApp Webhook Processing');
  console.log('=====================================\n');

  const webhookUrl = 'http://localhost:5002/api/whatsapp/webhook';
  
  // Test with a simple message first
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
    console.log('📤 Sending test message to webhook...');
    console.log('📱 Message payload:', JSON.stringify(testMessage, null, 2));
    console.log('');

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testMessage)
    });

    console.log('📥 Webhook response status:', response.status);
    console.log('📥 Webhook response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseBody = await response.text();
    console.log('📥 Webhook response body:', responseBody);
    
    if (response.ok) {
      console.log('✅ Webhook processed successfully');
    } else {
      console.log('❌ Webhook failed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugWebhook();
