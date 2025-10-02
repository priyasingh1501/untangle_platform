#!/usr/bin/env node

// Test WhatsApp Access Token
const fetch = require('node-fetch');
require('dotenv').config();

async function testWhatsAppToken() {
  console.log('🧪 Testing WhatsApp Access Token...\n');
  
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  
  if (!phoneNumberId || !accessToken) {
    console.log('❌ Missing required environment variables:');
    console.log('   WHATSAPP_PHONE_NUMBER_ID:', phoneNumberId ? '✅ Set' : '❌ Missing');
    console.log('   WHATSAPP_ACCESS_TOKEN:', accessToken ? '✅ Set' : '❌ Missing');
    return;
  }
  
  console.log('📱 Phone Number ID:', phoneNumberId);
  console.log('🔑 Access Token:', accessToken.substring(0, 20) + '...');
  console.log('');
  
  try {
    // Test token by getting phone number info
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Token is valid!');
      console.log('📞 Phone Number:', data.display_phone_number);
      console.log('📋 Status:', data.status);
      console.log('🌍 Country:', data.country);
      console.log('');
      console.log('🎉 Your WhatsApp bot is ready to use!');
    } else {
      const error = await response.json();
      console.log('❌ Token validation failed:');
      console.log('   Status:', response.status);
      console.log('   Error:', error.error?.message || 'Unknown error');
      console.log('');
      console.log('💡 Possible solutions:');
      console.log('   1. Check if token is permanent (not temporary)');
      console.log('   2. Verify token has correct permissions');
      console.log('   3. Ensure phone number ID is correct');
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

testWhatsAppToken();
