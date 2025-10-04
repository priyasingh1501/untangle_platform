#!/usr/bin/env node

// Verify if our authentication changes are deployed
const fetch = require('node-fetch');

async function testDeploymentVerification() {
  console.log('🔍 Verifying Deployment of Authentication Changes');
  console.log('================================================\n');

  const webhookUrl = 'https://lyfe-production.up.railway.app/api/whatsapp/webhook';
  
  const testPhoneNumber = '919805153470';
  const testEmail = 'priya99920@gmail.com';
  const testPassword = 'Priya@123';

  try {
    // Test 1: Send login command and check if we get the NEW error messages
    console.log('📱 Test 1: Testing for NEW authentication error messages');
    console.log('If our changes are deployed, we should see specific error messages...\n');
    
    await sendWhatsAppMessage(webhookUrl, testPhoneNumber, `login ${testEmail} ${testPassword}`);
    await sleep(3000);

    // Test 2: Try with a non-existent email to see if we get the NEW error message
    console.log('\n📱 Test 2: Testing with non-existent email');
    await sendWhatsAppMessage(webhookUrl, testPhoneNumber, 'login nonexistent@example.com password123');
    await sleep(3000);

    // Test 3: Try with wrong password to see if we get the NEW error message
    console.log('\n📱 Test 3: Testing with wrong password');
    await sendWhatsAppMessage(webhookUrl, testPhoneNumber, `login ${testEmail} wrongpassword`);
    await sleep(3000);

    console.log('\n✅ Tests completed!');
    console.log('\n💡 Check your WhatsApp for responses.');
    console.log('If our changes are deployed, you should see:');
    console.log('- "❌ No account found with this email. Please register on the web platform first."');
    console.log('- "❌ Invalid password. Please check your credentials."');
    console.log('- "❌ Account is temporarily locked due to multiple failed login attempts. Please try again later."');
    console.log('- "❌ Two-factor authentication is enabled for your account..."');
    console.log('');
    console.log('If you see OLD generic messages, our changes are NOT deployed yet.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function sendWhatsAppMessage(webhookUrl, phoneNumber, messageText) {
  try {
    const webhookPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'deployment_verification_test',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15556324225',
              phone_number_id: '796369900227467'
            },
            messages: [{
              from: phoneNumber,
              id: 'deployment_test_' + Date.now(),
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

    console.log(`📤 Sending: "${messageText}"`);

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
testDeploymentVerification().catch(console.error);
