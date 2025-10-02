#!/usr/bin/env node

// Exchange temporary token for permanent token
const fetch = require('node-fetch');
require('dotenv').config();

async function exchangeToken() {
  console.log('🔄 Token Exchange Helper');
  console.log('======================\n');
  
  const appId = await question('Enter your Facebook App ID: ');
  const appSecret = await question('Enter your Facebook App Secret: ');
  const tempToken = await question('Enter your temporary token: ');
  
  if (!appId || !appSecret || !tempToken) {
    console.log('❌ All fields are required');
    return;
  }
  
  try {
    const url = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tempToken}`;
    
    console.log('\n🔄 Exchanging token...');
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.access_token) {
      console.log('✅ Permanent token generated!');
      console.log('🔑 New token:', data.access_token);
      console.log('⏰ Expires:', data.expires_in ? `${data.expires_in} seconds` : 'Never');
      console.log('\n📝 Update your .env file:');
      console.log(`WHATSAPP_ACCESS_TOKEN=${data.access_token}`);
    } else {
      console.log('❌ Token exchange failed:', data.error?.message || 'Unknown error');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

exchangeToken().then(() => rl.close()).catch(console.error);
