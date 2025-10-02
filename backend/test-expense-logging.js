const fetch = require('node-fetch');

async function testExpenseLogging() {
  try {
    console.log('🧪 Testing Expense Logging');
    console.log('==========================\n');

    // Test 1: Login first
    console.log('📱 Test 1: Login');
    await sendTestMessage('login whatsapp-test@example.com testpass123');
    await sleep(2000);

    // Test 2: Try expense logging
    console.log('\n📱 Test 2: Log expense');
    await sendTestMessage('expense 50 coffee');
    await sleep(2000);

    // Test 3: Try different expense format
    console.log('\n📱 Test 3: Log expense with currency');
    await sendTestMessage('₹75 lunch');
    await sleep(2000);

    // Test 4: Try simple expense
    console.log('\n📱 Test 4: Simple expense');
    await sendTestMessage('spent 100 on groceries');
    await sleep(2000);

    // Test 5: Check status
    console.log('\n📱 Test 5: Check status');
    await sendTestMessage('status');
    await sleep(1000);

    console.log('\n✅ Expense logging tests completed!');
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

testExpenseLogging();
