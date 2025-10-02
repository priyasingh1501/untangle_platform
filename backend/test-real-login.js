const fetch = require('node-fetch');

async function testRealLogin() {
  try {
    console.log('🧪 Testing Real WhatsApp Login');
    console.log('==============================\n');

    // Test login message
    console.log('📱 Test 1: Login with credentials');
    await sendTestMessage('login whatsapp-test@example.com testpass123');
    await sleep(2000);

    // Test status check
    console.log('\n📱 Test 2: Check status');
    await sendTestMessage('status');
    await sleep(1000);

    // Test expense logging
    console.log('\n📱 Test 3: Log expense');
    await sendTestMessage('expense 50 coffee');
    await sleep(1000);

    // Test logout
    console.log('\n📱 Test 4: Logout');
    await sendTestMessage('logout');
    await sleep(1000);

    console.log('\n✅ All tests completed! Check server logs for responses.');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function sendTestMessage(messageText) {
  try {
    const webhookPayload = {
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
              from: '919805153470', // Your real phone number
              id: 'test_message_id_' + Date.now(),
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

    const response = await fetch('http://localhost:5002/api/whatsapp/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });

    const result = await response.json();
    console.log(`📤 Sent: "${messageText}"`);
    console.log(`📥 Response: ${JSON.stringify(result)}`);
  } catch (error) {
    console.error(`❌ Error sending "${messageText}":`, error.message);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

testRealLogin();
