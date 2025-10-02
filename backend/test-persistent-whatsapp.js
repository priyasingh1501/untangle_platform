const fetch = require('node-fetch');

async function testPersistentWhatsApp() {
  try {
    console.log('🧪 Testing Persistent WhatsApp Bot');
    console.log('==================================\n');

    // Test 1: Login
    console.log('📱 Test 1: Login with credentials');
    await sendTestMessage('login whatsapp-test@example.com testpass123');
    await sleep(2000);

    // Test 2: Check status
    console.log('\n📱 Test 2: Check status');
    await sendTestMessage('status');
    await sleep(1000);

    // Test 3: Log some data
    console.log('\n📱 Test 3: Log expense');
    await sendTestMessage('expense 75 lunch');
    await sleep(1000);

    console.log('\n📱 Test 4: Log food');
    await sendTestMessage('food chicken rice');
    await sleep(1000);

    // Test 5: Check status again
    console.log('\n📱 Test 5: Check status again');
    await sendTestMessage('status');
    await sleep(1000);

    console.log('\n✅ All tests completed!');
    console.log('\n💡 Now restart the server and test again - the user should still be logged in!');
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

testPersistentWhatsApp();
