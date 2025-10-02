#!/usr/bin/env node

// Helper script to get permanent WhatsApp access token
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function getPermanentToken() {
  console.log('🔑 WhatsApp Permanent Token Setup Guide');
  console.log('=======================================\n');
  
  console.log('Your current token has expired. Here are 3 methods to get a permanent token:\n');
  
  console.log('📋 Method 1: Facebook Developer Console (Easiest)');
  console.log('1. Go to: https://developers.facebook.com/');
  console.log('2. Select your WhatsApp Business app');
  console.log('3. Go to WhatsApp → API Setup');
  console.log('4. Click "Generate Token"');
  console.log('5. Look for "Permanent" or "Never Expires" option');
  console.log('6. If not available, use Method 2\n');
  
  console.log('📋 Method 2: Business Manager (Most Reliable)');
  console.log('1. Go to: https://business.facebook.com/settings');
  console.log('2. Select your business account');
  console.log('3. Go to "System Users" tab');
  console.log('4. Click "Add" → "Create New System User"');
  console.log('5. Name: "WhatsApp Bot System User", Role: "Admin"');
  console.log('6. Click "Generate New Token"');
  console.log('7. Select your WhatsApp app');
  console.log('8. Choose permissions: whatsapp_business_messaging, whatsapp_business_management');
  console.log('9. Select "Never Expires"');
  console.log('10. Copy the token\n');
  
  console.log('📋 Method 3: Graph API Explorer');
  console.log('1. Go to: https://developers.facebook.com/tools/explorer/');
  console.log('2. Select your app and get user access token');
  console.log('3. Exchange for permanent token using:');
  console.log('   GET /oauth/access_token?grant_type=fb_exchange_token&client_id={app-id}&client_secret={app-secret}&fb_exchange_token={short-lived-token}\n');
  
  const newToken = await question('Enter your new permanent token (or press Enter to skip): ');
  
  if (newToken.trim()) {
    console.log('\n✅ Token received! Now update your .env file:');
    console.log(`WHATSAPP_ACCESS_TOKEN=${newToken.trim()}`);
    console.log('\nThen test it with: node test-whatsapp-token.js');
  } else {
    console.log('\n📝 Manual steps:');
    console.log('1. Get permanent token using one of the methods above');
    console.log('2. Update your .env file with the new token');
    console.log('3. Run: node test-whatsapp-token.js');
    console.log('4. Start your server: npm start');
  }
  
  rl.close();
}

getPermanentToken().catch(console.error);
