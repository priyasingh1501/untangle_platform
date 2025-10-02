#!/usr/bin/env node

// Auto-refresh WhatsApp token script
const fetch = require('node-fetch');
require('dotenv').config();

async function refreshToken() {
  console.log('🔄 WhatsApp Token Refresh Script');
  console.log('================================\n');
  
  const currentToken = process.env.WHATSAPP_ACCESS_TOKEN;
  
  if (!currentToken) {
    console.log('❌ No token found in environment variables');
    return;
  }
  
  console.log('🔑 Current token:', currentToken.substring(0, 20) + '...');
  
  try {
    // Test current token
    const testResponse = await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`, {
      headers: {
        'Authorization': `Bearer ${currentToken}`
      }
    });
    
    if (testResponse.ok) {
      console.log('✅ Current token is still valid');
      return;
    }
    
    console.log('⚠️ Token expired, attempting to refresh...');
    
    // Try to refresh using app credentials
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    
    if (!appId || !appSecret) {
      console.log('❌ Missing Facebook App credentials');
      console.log('💡 Add these to your .env file:');
      console.log('   FACEBOOK_APP_ID=your_app_id');
      console.log('   FACEBOOK_APP_SECRET=your_app_secret');
      return;
    }
    
    const refreshUrl = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${currentToken}`;
    
    const refreshResponse = await fetch(refreshUrl);
    const refreshData = await refreshResponse.json();
    
    if (refreshData.access_token) {
      console.log('✅ Token refreshed successfully!');
      console.log('🔑 New token:', refreshData.access_token);
      console.log('⏰ Expires in:', refreshData.expires_in ? `${refreshData.expires_in} seconds` : 'Never');
      console.log('\n📝 Update your .env file with the new token');
    } else {
      console.log('❌ Token refresh failed:', refreshData.error?.message || 'Unknown error');
      console.log('\n💡 Manual steps:');
      console.log('1. Go to Business Manager: https://business.facebook.com/settings');
      console.log('2. Create System User with "Never Expires" token');
      console.log('3. Update WHATSAPP_ACCESS_TOKEN in .env');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

refreshToken();
