#!/usr/bin/env node

// Test WhatsApp sendMessage function directly
require('dotenv').config();
const fetch = require('node-fetch');

async function testSendMessage() {
  console.log('🧪 Testing WhatsApp SendMessage Function');
  console.log('=======================================\n');

  const phoneNumber = '919019384482'; // Your actual WhatsApp Business number
  const message = 'Hello! This is a test message from the WhatsApp bot.';

  console.log('📱 Phone Number:', phoneNumber);
  console.log('📝 Message:', message);
  console.log('🔑 Access Token:', process.env.WHATSAPP_ACCESS_TOKEN ? 'Present' : 'Missing');
  console.log('📞 Phone Number ID:', process.env.WHATSAPP_PHONE_NUMBER_ID);
  console.log('');

  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: message
        }
      })
    });

    console.log('📤 WhatsApp API Response Status:', response.status);
    console.log('📤 WhatsApp API Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseBody = await response.text();
    console.log('📤 WhatsApp API Response Body:', responseBody);
    
    if (response.ok) {
      console.log('✅ Message sent successfully!');
    } else {
      console.log('❌ Failed to send message');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSendMessage();
