const fetch = require('node-fetch');

async function testRealWebhook() {
  try {
    console.log('🧪 Testing Real Webhook Simulation...');
    
    // Simulate a real webhook payload from WhatsApp
    const webhookPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'real_entry_id',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15556324225',
              phone_number_id: '796369900227467'
            },
            messages: [{
              from: '919805153470', // Your real phone number
              id: 'real_message_id_' + Date.now(),
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

    console.log('📤 Sending webhook payload to server...');
    console.log('📱 From phone: 919805153470');
    console.log('💬 Message: help');

    const response = await fetch('http://localhost:5002/api/whatsapp/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Webhook processed successfully!');
      console.log('Response:', result);
    } else {
      const error = await response.text();
      console.log('❌ Webhook failed:');
      console.log(error);
    }

  } catch (error) {
    console.error('❌ Error testing webhook:', error);
  }
}

testRealWebhook();
