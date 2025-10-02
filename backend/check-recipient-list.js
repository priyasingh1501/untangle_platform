require('dotenv').config({ path: './.env' });

async function checkRecipientList() {
  try {
    console.log('🔍 Checking WhatsApp Recipient List');
    console.log('===================================\n');

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      console.error('❌ Missing WhatsApp credentials in .env file');
      return;
    }

    console.log(`📱 Phone Number ID: ${phoneNumberId}`);
    console.log(`🔑 Access Token: ${accessToken.substring(0, 20)}...`);

    // Check if we can get business account info
    const businessAccountUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}`;
    
    const response = await fetch(businessAccountUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Business Account Info:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const errorData = await response.text();
      console.error('❌ Error getting business account info:');
      console.error(`Status: ${response.status}`);
      console.error(`Response: ${errorData}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkRecipientList();
