#!/usr/bin/env node

// WhatsApp Business API Credentials Setup Guide
// This script will guide you through getting your WhatsApp Business API credentials

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupWhatsAppCredentials() {
  console.log('🚀 WhatsApp Business API Setup Guide');
  console.log('====================================\n');

  console.log('📋 Prerequisites:');
  console.log('✅ Facebook account');
  console.log('✅ Phone number for WhatsApp Business');
  console.log('✅ Domain/server for webhook (can use ngrok for testing)');
  console.log('');

  // Step 1: Facebook Developer Account
  console.log('🔵 Step 1: Create Facebook Developer Account');
  console.log('=============================================');
  console.log('1. Go to: https://developers.facebook.com/');
  console.log('2. Click "My Apps" → "Create App"');
  console.log('3. Select "Business" as app type');
  console.log('4. Fill in app details:');
  console.log('   - App Name: "Untangle WhatsApp Bot"');
  console.log('   - App Contact Email: your-email@example.com');
  console.log('   - Business Account: Select or create one');
  console.log('5. Click "Create App"');
  console.log('');

  await question('Press Enter when you have created your Facebook app...');

  // Step 2: Add WhatsApp Product
  console.log('\n🔵 Step 2: Add WhatsApp Product');
  console.log('===============================');
  console.log('1. In your app dashboard, click "Add Product"');
  console.log('2. Find "WhatsApp" and click "Set up"');
  console.log('3. You should see the WhatsApp setup page');
  console.log('');

  await question('Press Enter when you have added the WhatsApp product...');

  // Step 3: Get Phone Number ID
  console.log('\n🔵 Step 3: Get Phone Number ID');
  console.log('==============================');
  console.log('1. In WhatsApp → API Setup, you should see "Phone number ID"');
  console.log('2. Copy the Phone number ID (looks like: 123456789012345)');
  console.log('');

  const phoneNumberId = await question('Enter your Phone Number ID: ');

  // Step 4: Get Access Token
  console.log('\n🔵 Step 4: Get Access Token');
  console.log('===========================');
  console.log('1. In the same section, click "Generate Token"');
  console.log('2. Select "Permanent" token');
  console.log('3. Copy the access token (starts with "EAA...")');
  console.log('');

  const accessToken = await question('Enter your Access Token: ');

  // Step 5: Set Verify Token
  console.log('\n🔵 Step 5: Set Verify Token');
  console.log('===========================');
  console.log('We\'ll use a secure verify token for your webhook.');
  console.log('');

  const verifyToken = 'untangle_whatsapp_verify_' + Math.random().toString(36).substring(2, 15);
  console.log(`Your verify token: ${verifyToken}`);
  console.log('(This will be used for webhook verification)');
  console.log('');

  // Step 6: Update .env file
  console.log('🔵 Step 6: Update Environment Variables');
  console.log('=======================================');

  const envPath = path.join(__dirname, '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');

  // Update WhatsApp variables
  envContent = envContent.replace(
    /WHATSAPP_PHONE_NUMBER_ID=.*/,
    `WHATSAPP_PHONE_NUMBER_ID=${phoneNumberId}`
  );
  envContent = envContent.replace(
    /WHATSAPP_ACCESS_TOKEN=.*/,
    `WHATSAPP_ACCESS_TOKEN=${accessToken}`
  );
  envContent = envContent.replace(
    /WHATSAPP_VERIFY_TOKEN=.*/,
    `WHATSAPP_VERIFY_TOKEN=${verifyToken}`
  );

  fs.writeFileSync(envPath, envContent);
  console.log('✅ Updated .env file with your credentials');
  console.log('');

  // Step 7: Webhook Setup
  console.log('🔵 Step 7: Configure Webhook');
  console.log('============================');
  console.log('Now you need to set up your webhook URL.');
  console.log('');

  const webhookUrl = await question('Enter your webhook URL (e.g., https://your-domain.com/api/whatsapp/webhook): ');

  // Update webhook URL in .env
  envContent = envContent.replace(
    /WHATSAPP_WEBHOOK_URL=.*/,
    `WHATSAPP_WEBHOOK_URL=${webhookUrl}`
  );
  fs.writeFileSync(envPath, envContent);

  console.log('\n🔵 Step 8: Configure Webhook in Facebook Console');
  console.log('================================================');
  console.log('1. Go to WhatsApp → Configuration');
  console.log('2. Set Callback URL to:', webhookUrl);
  console.log('3. Set Verify Token to:', verifyToken);
  console.log('4. Click "Verify and Save"');
  console.log('');

  // Step 9: Subscribe to Webhook Fields
  console.log('🔵 Step 9: Subscribe to Webhook Fields');
  console.log('======================================');
  console.log('In the same Configuration page:');
  console.log('✅ Check "messages"');
  console.log('✅ Check "message_deliveries"');
  console.log('✅ Check "message_reads"');
  console.log('Click "Save"');
  console.log('');

  await question('Press Enter when you have configured the webhook...');

  // Step 10: Test Setup
  console.log('\n🔵 Step 10: Test Your Setup');
  console.log('============================');
  console.log('1. Start your server: npm start');
  console.log('2. Test webhook verification:');
  console.log(`   curl "http://localhost:5002/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=test"`);
  console.log('3. Send a test message to your WhatsApp Business number');
  console.log('');

  // Step 11: Test Messages
  console.log('🔵 Step 11: Test Messages');
  console.log('=========================');
  console.log('Try these test messages:');
  console.log('• "₹450 Uber 2025-09-27" (expense)');
  console.log('• "ate breakfast - toast and eggs" (food)');
  console.log('• "meditation done" (habit)');
  console.log('• "Feeling good today" (journal)');
  console.log('');

  console.log('🎉 Setup Complete!');
  console.log('==================');
  console.log('Your WhatsApp bot is now configured and ready to use!');
  console.log('');
  console.log('📚 Next Steps:');
  console.log('1. Test with real WhatsApp messages');
  console.log('2. Monitor server logs for any issues');
  console.log('3. Customize responses in whatsapp-bot-config.js');
  console.log('4. Add more parsing rules as needed');
  console.log('');

  rl.close();
}

// Run setup
setupWhatsAppCredentials().catch(console.error);
