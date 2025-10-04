#!/usr/bin/env node

// Test WhatsApp Authentication Directly
const fetch = require('node-fetch');

async function testAuthDirectly() {
  console.log('🧪 Testing WhatsApp Authentication Directly');
  console.log('==========================================\n');

  const webhookUrl = 'https://lyfe-production.up.railway.app/api/whatsapp/webhook';
  
  // Test with your actual credentials
  const testPhoneNumber = '919805153470'; // Your actual phone number
  const testEmail = 'priya99920@gmail.com'; // Your actual email  
  const testPassword = 'Priya@123'; // Your actual password

  console.log('⚠️  UPDATE THE CREDENTIALS IN THIS SCRIPT WITH YOUR REAL ONES!');
  console.log(`📱 Phone: ${testPhoneNumber}`);
  console.log(`📧 Email: ${testEmail}`);
  console.log(`🔑 Password: ${testPassword}`);
  console.log('');

  try {
    // Test login command
    console.log('📱 Testing login command...');
    await sendWhatsAppMessage(webhookUrl, testPhoneNumber, `login ${testEmail} ${testPassword}`);
    await sleep(3000);

    // Test status
    console.log('\n📱 Testing status command...');
    await sendWhatsAppMessage(webhookUrl, testPhoneNumber, 'status');
    await sleep(2000);

    console.log('\n✅ Test completed!');
    console.log('\n💡 If login is still failing, the issue might be:');
    console.log('   1. Railway hasn\'t deployed the latest changes yet');
    console.log('   2. Your credentials are different from what works on the website');
    console.log('   3. There\'s a database connection issue');
    console.log('   4. The user account has specific restrictions');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function sendWhatsAppMessage(webhookUrl, phoneNumber, messageText) {
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
              from: phoneNumber,
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

    console.log(`📤 Sending: "${messageText}" to ${phoneNumber}`);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });

    const result = await response.json();
    console.log(`📥 Response: ${JSON.stringify(result)}`);
    
    if (!response.ok) {
      console.log(`❌ HTTP ${response.status}: ${response.statusText}`);
    }

  } catch (error) {
    console.error(`❌ Error sending "${messageText}":`, error.message);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the test
testAuthDirectly().catch(console.error);
