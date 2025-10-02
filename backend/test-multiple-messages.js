#!/usr/bin/env node

// Test multiple WhatsApp message types
const fetch = require('node-fetch');

async function testMessage(messageText, description) {
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
            id: `test_message_${Date.now()}`,
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

  try {
    console.log(`📱 Testing: "${messageText}" (${description})`);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testMessage)
    });

    if (response.ok) {
      console.log('✅ Success');
    } else {
      console.log('❌ Failed:', response.status);
    }
    console.log('');
    
    // Wait a bit between messages
    await new Promise(resolve => setTimeout(resolve, 1000));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testAllMessages() {
  console.log('🧪 Testing WhatsApp Bot with Multiple Message Types');
  console.log('==================================================\n');

  const testCases = [
    { message: 'help', description: 'Help command' },
    { message: 'login', description: 'Authentication start' },
    { message: '₹450 Uber', description: 'Expense logging' },
    { message: 'ate breakfast', description: 'Food logging' },
    { message: 'meditation done', description: 'Habit tracking' },
    { message: 'Feeling good today', description: 'Journal entry' },
    { message: 'status', description: 'Auth status check' }
  ];

  for (const testCase of testCases) {
    await testMessage(testCase.message, testCase.description);
  }

  console.log('🎉 All tests completed!');
  console.log('💡 Check server logs to see the bot responses');
}

testAllMessages();
