const fetch = require('node-fetch');
require('dotenv').config();

async function checkWhatsAppAccount() {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    
    if (!accessToken || !phoneNumberId) {
      console.log('❌ Missing WhatsApp credentials in .env file');
      return;
    }

    console.log('🔍 Checking WhatsApp Business Account...');
    console.log(`📱 Phone Number ID: ${phoneNumberId}`);
    console.log(`🔑 Access Token: ${accessToken.substring(0, 20)}...`);

    // Check phone number details
    const phoneResponse = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (phoneResponse.ok) {
      const phoneData = await phoneResponse.json();
      console.log('📱 Phone Number Details:');
      console.log(JSON.stringify(phoneData, null, 2));
    } else {
      const error = await phoneResponse.text();
      console.log('❌ Phone Number API Error:', error);
    }

    // Check business account details
    const businessResponse = await fetch(`https://graph.facebook.com/v18.0/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (businessResponse.ok) {
      const businessData = await businessResponse.json();
      console.log('🏢 Business Account Details:');
      console.log(JSON.stringify(businessData, null, 2));
    } else {
      const error = await businessResponse.text();
      console.log('❌ Business Account API Error:', error);
    }

  } catch (error) {
    console.error('❌ Error checking WhatsApp account:', error);
  }
}

checkWhatsAppAccount();
