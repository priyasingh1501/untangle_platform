#!/usr/bin/env node

// Simple webhook test with detailed logging
const fetch = require('node-fetch');

async function testWebhookWithLogging() {
  console.log('🔍 Testing Webhook with Detailed Logging');
  console.log('=====================================\n');

  const webhookUrl = 'http://localhost:5002/api/whatsapp/webhook';
  
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
    console.log('📤 Sending webhook request...');
    console.log('📱 Payload:', JSON.stringify(testMessage, null, 2));
    console.log('');

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testMessage)
    });

    console.log('📥 Response Status:', response.status);
    const responseBody = await response.text();
    console.log('📥 Response Body:', responseBody);
    
    if (response.ok) {
      console.log('✅ Webhook processed successfully');
    } else {
      console.log('❌ Webhook failed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testWebhookWithLogging();
