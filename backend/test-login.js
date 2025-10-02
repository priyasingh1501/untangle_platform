const fetch = require('node-fetch');

async function testLogin() {
  try {
    console.log('🧪 Testing WhatsApp Login Functionality');
    console.log('=====================================\n');

    // Test 1: Help command
    console.log('📱 Test 1: Help command');
    await sendTestMessage('help');
    await sleep(1000);

    // Test 2: Login with credentials
    console.log('\n📱 Test 2: Login with credentials');
    await sendTestMessage('login test@example.com password123');
    await sleep(1000);

    // Test 3: Check status
    console.log('\n📱 Test 3: Check status');
    await sendTestMessage('status');
    await sleep(1000);

    // Test 4: Logout
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

testLogin();
