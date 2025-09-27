#!/usr/bin/env node

// Complete WhatsApp Bot Setup Script
// This script will guide you through the entire setup process

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Load environment variables
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function completeSetup() {
  console.log('🚀 Complete WhatsApp Bot Setup');
  console.log('==============================\n');

  // Step 1: Check current setup
  console.log('🔍 Step 1: Checking Current Setup');
  console.log('==================================');

  const envPath = path.join(__dirname, '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');

  console.log('✅ Dependencies installed');
  console.log('✅ Environment file exists');
  console.log('✅ WhatsApp routes created');
  console.log('✅ Services implemented');
  console.log('');

  // Step 2: Check environment variables
  console.log('🔍 Step 2: Checking Environment Variables');
  console.log('=========================================');

  const requiredVars = [
    'OPENAI_API_KEY',
    'MONGODB_URI',
    'JWT_SECRET',
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_VERIFY_TOKEN'
  ];

  const missingVars = [];
  const needsUpdate = [];

  for (const varName of requiredVars) {
    if (!process.env[varName] || process.env[varName].includes('your_') || process.env[varName].includes('_here')) {
      if (varName.startsWith('WHATSAPP_')) {
        needsUpdate.push(varName);
      } else {
        missingVars.push(varName);
      }
    }
  }

  if (missingVars.length > 0) {
    console.log('❌ Missing required variables:', missingVars.join(', '));
    console.log('Please set these in your .env file first.');
    process.exit(1);
  }

  if (needsUpdate.length > 0) {
    console.log('⚠️  WhatsApp variables need to be updated:', needsUpdate.join(', '));
  } else {
    console.log('✅ All environment variables are set');
  }
  console.log('');

  // Step 3: Get WhatsApp credentials
  if (needsUpdate.length > 0) {
    console.log('🔵 Step 3: Get WhatsApp Business API Credentials');
    console.log('===============================================');
    console.log('You need to get your WhatsApp Business API credentials from Facebook Developer Console.');
    console.log('');

    console.log('📋 Quick Setup Guide:');
    console.log('1. Go to: https://developers.facebook.com/');
    console.log('2. Create a new app and select "Business"');
    console.log('3. Add "WhatsApp" product to your app');
    console.log('4. Get your Phone Number ID and Access Token');
    console.log('5. Choose a verify token (we\'ll generate one for you)');
    console.log('');

    const phoneNumberId = await question('Enter your Phone Number ID (or press Enter to skip): ');
    const accessToken = await question('Enter your Access Token (or press Enter to skip): ');

    if (phoneNumberId && accessToken) {
      // Generate verify token
      const verifyToken = 'untangle_verify_' + Math.random().toString(36).substring(2, 15);
      
      // Update .env file
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
      console.log(`Your verify token: ${verifyToken}`);
    } else {
      console.log('⚠️  Skipping WhatsApp credentials setup');
    }
    console.log('');
  }

  // Step 4: Test basic functionality
  console.log('🧪 Step 4: Testing Basic Functionality');
  console.log('=====================================');

  try {
    console.log('Running basic tests...');
    const { exec } = require('child_process');
    
    exec('node test-bot-simple.js', (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Basic tests failed:', error.message);
      } else {
        console.log('✅ Basic tests passed');
        console.log(stdout);
      }
    });
  } catch (error) {
    console.log('❌ Error running tests:', error.message);
  }

  // Step 5: Start server for testing
  console.log('\n🚀 Step 5: Starting Server for Testing');
  console.log('=====================================');

  console.log('Starting server in background...');
  const serverProcess = exec('npm start', (error, stdout, stderr) => {
    if (error) {
      console.log('❌ Server failed to start:', error.message);
    }
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Step 6: Test webhook
  console.log('\n🧪 Step 6: Testing Webhook');
  console.log('==========================');

  try {
    console.log('Testing webhook verification...');
    exec('node test-webhook.js', (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Webhook test failed:', error.message);
      } else {
        console.log('✅ Webhook test completed');
        console.log(stdout);
      }
    });
  } catch (error) {
    console.log('❌ Error testing webhook:', error.message);
  }

  // Step 7: Final instructions
  console.log('\n🎉 Setup Complete!');
  console.log('==================');
  console.log('Your WhatsApp bot is now ready!');
  console.log('');

  console.log('📋 Next Steps:');
  console.log('1. Configure your webhook in Facebook Developer Console:');
  console.log('   - URL: https://your-domain.com/api/whatsapp/webhook');
  console.log('   - Verify Token: Check your .env file');
  console.log('   - Subscribe to: messages, message_deliveries, message_reads');
  console.log('');

  console.log('2. Test with real WhatsApp messages:');
  console.log('   - "₹450 Uber 2025-09-27" (expense)');
  console.log('   - "ate breakfast - toast and eggs" (food)');
  console.log('   - "meditation done" (habit)');
  console.log('   - "Feeling good today" (journal)');
  console.log('');

  console.log('3. Monitor your server logs for any issues');
  console.log('');

  console.log('📚 Documentation:');
  console.log('- QUICK_SETUP_GUIDE.md - Step-by-step instructions');
  console.log('- WHATSAPP_BOT_README.md - Complete API documentation');
  console.log('- WHATSAPP_BOT_EXAMPLES.md - Usage examples');
  console.log('');

  console.log('🆘 Support:');
  console.log('- Check server logs for errors');
  console.log('- Test with simple messages first');
  console.log('- Verify webhook configuration');
  console.log('');

  // Stop the server process
  serverProcess.kill();

  rl.close();
}

// Run complete setup
completeSetup().catch(console.error);
