#!/usr/bin/env node

// WhatsApp Bot Setup Script
// This script helps you set up the WhatsApp bot step by step

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupWhatsAppBot() {
  console.log('🚀 WhatsApp Bot Setup for Untangle Platform');
  console.log('==========================================\n');

  // Step 1: Check if .env file exists
  const envPath = path.join(__dirname, '.env');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    console.log('✅ Found existing .env file');
    envContent = fs.readFileSync(envPath, 'utf8');
  } else {
    console.log('⚠️  No .env file found. Creating one...');
    envContent = `# Server Configuration
PORT=5002
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/untangle

# JWT Configuration
JWT_SECRET=fdhghdg3455fef

# OpenAI API Key (required for WhatsApp bot)
OPENAI_API_KEY=your_openai_api_key_here

# External Data Sources
USDA_API_KEY=""
OFF_DISABLE="false"

# Seed QA Configuration
SEED_QA_ATWATER_TOLERANCE="30"
SEED_QA_PORTION_BANDS='{"roti": [35,60], "idli": [80,180]}'

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,https://your-frontend-domain.com

`;
  }

  // Step 2: Check for required variables
  const requiredVars = [
    'OPENAI_API_KEY',
    'MONGODB_URI',
    'JWT_SECRET'
  ];

  const missingVars = requiredVars.filter(varName => 
    !envContent.includes(`${varName}=`) || 
    envContent.includes(`${varName}=your_`) ||
    envContent.includes(`${varName}="`)
  );

  if (missingVars.length > 0) {
    console.log('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.log(`   - ${varName}`));
    console.log('\nPlease set these variables in your .env file first.');
    process.exit(1);
  }

  console.log('✅ All required base variables are configured');

  // Step 3: Add WhatsApp variables
  console.log('\n📱 WhatsApp Bot Configuration');
  console.log('============================');

  const whatsappVars = [
    {
      name: 'WHATSAPP_PHONE_NUMBER_ID',
      description: 'Your WhatsApp Business Phone Number ID (from Facebook Developer Console)',
      example: '123456789012345'
    },
    {
      name: 'WHATSAPP_ACCESS_TOKEN',
      description: 'Your WhatsApp Business Access Token (permanent token)',
      example: 'EAAxxxxxxxxxxxxxxxxxxxxx'
    },
    {
      name: 'WHATSAPP_VERIFY_TOKEN',
      description: 'Custom verification token for webhook (choose any secure string)',
      example: 'my_secure_verify_token_123'
    },
    {
      name: 'WHATSAPP_WEBHOOK_URL',
      description: 'Your webhook URL (will be set after deployment)',
      example: 'https://your-domain.com/api/whatsapp/webhook'
    }
  ];

  let whatsappConfig = '\n# WhatsApp Bot Configuration\n';
  
  for (const varInfo of whatsappVars) {
    console.log(`\n${varInfo.name}:`);
    console.log(`   Description: ${varInfo.description}`);
    console.log(`   Example: ${varInfo.example}`);
    
    const value = await question(`   Enter value (or press Enter to skip): `);
    
    if (value.trim()) {
      whatsappConfig += `${varInfo.name}=${value.trim()}\n`;
    } else {
      whatsappConfig += `${varInfo.name}=your_${varInfo.name.toLowerCase()}_here\n`;
    }
  }

  // Step 4: Update .env file
  if (!envContent.includes('# WhatsApp Bot Configuration')) {
    envContent += whatsappConfig;
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ Updated .env file with WhatsApp configuration');
  } else {
    console.log('\n⚠️  WhatsApp configuration already exists in .env file');
  }

  // Step 5: Test configuration
  console.log('\n🧪 Testing Configuration');
  console.log('=======================');

  try {
    require('dotenv').config({ path: envPath });
    
    const testVars = [
      'OPENAI_API_KEY',
      'MONGODB_URI',
      'JWT_SECRET',
      'WHATSAPP_PHONE_NUMBER_ID',
      'WHATSAPP_ACCESS_TOKEN',
      'WHATSAPP_VERIFY_TOKEN'
    ];

    const missingTestVars = testVars.filter(varName => 
      !process.env[varName] || 
      process.env[varName].includes('your_') ||
      process.env[varName].includes('_here')
    );

    if (missingTestVars.length === 0) {
      console.log('✅ All WhatsApp variables are properly configured');
    } else {
      console.log('⚠️  Some variables need to be configured:');
      missingTestVars.forEach(varName => console.log(`   - ${varName}`));
    }

  } catch (error) {
    console.log('❌ Error testing configuration:', error.message);
  }

  // Step 6: Next steps
  console.log('\n📋 Next Steps');
  console.log('=============');
  console.log('1. Set up your WhatsApp Business API:');
  console.log('   - Go to https://developers.facebook.com/');
  console.log('   - Create a new app and add WhatsApp product');
  console.log('   - Get your Phone Number ID and Access Token');
  console.log('   - Update your .env file with the correct values');
  console.log('');
  console.log('2. Configure your webhook:');
  console.log('   - Set webhook URL to: https://your-domain.com/api/whatsapp/webhook');
  console.log('   - Set verify token to match WHATSAPP_VERIFY_TOKEN');
  console.log('   - Subscribe to: messages, message_deliveries, message_reads');
  console.log('');
  console.log('3. Test the bot:');
  console.log('   - Run: node test-whatsapp-bot.js');
  console.log('   - Start your server: npm start');
  console.log('   - Send a test message to your WhatsApp Business number');
  console.log('');
  console.log('4. Deploy:');
  console.log('   - Run: ./deploy-whatsapp-bot.sh');
  console.log('   - Update WHATSAPP_WEBHOOK_URL with your production domain');

  rl.close();
}

// Run setup
setupWhatsAppBot().catch(console.error);
