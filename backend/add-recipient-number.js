const fetch = require('node-fetch');
require('dotenv').config();

async function addRecipientNumber() {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const businessAccountId = '122093783577060781'; // From the account check
    
    if (!accessToken || !phoneNumberId) {
      console.log('❌ Missing WhatsApp credentials in .env file');
      return;
    }

    console.log('🔍 Attempting to add recipient number...');
    console.log(`📱 Phone Number ID: ${phoneNumberId}`);
    console.log(`🏢 Business Account ID: ${businessAccountId}`);
    console.log(`🔑 Access Token: ${accessToken.substring(0, 20)}...`);

    // Your phone number to add
    const recipientNumber = '+919805153470';
    
    console.log(`📞 Adding recipient: ${recipientNumber}`);

    // Try to add recipient via Business Account API
    const addResponse = await fetch(`https://graph.facebook.com/v18.0/${businessAccountId}/recipients`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone_number: recipientNumber
      })
    });

    if (addResponse.ok) {
      const result = await addResponse.json();
      console.log('✅ Successfully added recipient:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      const error = await addResponse.text();
      console.log('❌ Failed to add recipient:');
      console.log(error);
      
      // Try alternative approach
      console.log('\n🔄 Trying alternative approach...');
      
      const altResponse = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/recipients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone_number: recipientNumber
        })
      });

      if (altResponse.ok) {
        const result = await altResponse.json();
        console.log('✅ Successfully added recipient (alternative method):');
        console.log(JSON.stringify(result, null, 2));
      } else {
        const altError = await altResponse.text();
        console.log('❌ Alternative method also failed:');
        console.log(altError);
      }
    }

  } catch (error) {
    console.error('❌ Error adding recipient:', error);
  }
}

addRecipientNumber();
