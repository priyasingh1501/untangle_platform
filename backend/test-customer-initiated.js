const fetch = require('node-fetch');
require('dotenv').config();

async function testCustomerInitiated() {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    
    if (!accessToken || !phoneNumberId) {
      console.log('❌ Missing WhatsApp credentials in .env file');
      return;
    }

    console.log('🧪 Testing Customer-Initiated Conversation...');
    console.log(`📱 Phone Number ID: ${phoneNumberId}`);
    console.log(`🔑 Access Token: ${accessToken.substring(0, 20)}...`);

    // Test sending a message to your personal number
    const recipientNumber = '919805153470'; // Your number without +
    const message = 'Hello! This is a test message from your WhatsApp bot.';

    console.log(`📞 Sending message to: ${recipientNumber}`);
    console.log(`💬 Message: ${message}`);

    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipientNumber,
        type: 'text',
        text: {
          body: message
        }
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Message sent successfully!');
      console.log(JSON.stringify(result, null, 2));
    } else {
      const error = await response.text();
      console.log('❌ Failed to send message:');
      console.log(error);
      
      // Parse the error to understand what's wrong
      try {
        const errorObj = JSON.parse(error);
        if (errorObj.error) {
          console.log('\n🔍 Error Analysis:');
          console.log(`- Error Code: ${errorObj.error.code}`);
          console.log(`- Error Message: ${errorObj.error.message}`);
          console.log(`- Error Type: ${errorObj.error.type}`);
          
          if (errorObj.error.code === 131030) {
            console.log('\n💡 Solution: This is a recipient restriction error.');
            console.log('   Your WhatsApp Business Account is in test mode.');
            console.log('   You need to either:');
            console.log('   1. Register a business and verify your account');
            console.log('   2. Add recipient numbers to the allowed list');
            console.log('   3. Use customer-initiated conversations only');
          }
        }
      } catch (parseError) {
        console.log('Could not parse error response');
      }
    }

  } catch (error) {
    console.error('❌ Error testing customer-initiated conversation:', error);
  }
}

testCustomerInitiated();
