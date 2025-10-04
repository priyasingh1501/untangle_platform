#!/usr/bin/env node

// Debug WhatsApp Bot Database Connection
const mongoose = require('mongoose');
const User = require('./server/models/User');

async function debugWhatsAppDbConnection() {
  console.log('🔍 Debugging WhatsApp Bot Database Connection');
  console.log('============================================\n');

  const testEmail = 'priya99920@gmail.com';
  const testPassword = 'Priya@123';

  try {
    // Connect using the SAME connection string as Railway
    console.log('🔗 Connecting to Railway database...');
    const mongoUri = 'mongodb+srv://priya99920_db_user:uirth0hRwtjBs4le@cluster0.dzzxbyq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to Railway database\n');

    // Test the EXACT same logic as WhatsApp bot
    console.log('🧪 Testing EXACT WhatsApp bot authentication logic...');
    
    // Step 1: Find user by email (exactly like WhatsApp bot)
    console.log('📧 Step 1: Finding user by email');
    const user = await User.findOne({ email: testEmail.toLowerCase() });
    if (!user) {
      console.log('❌ User not found - this would cause "No account found" error');
      return;
    }
    console.log('✅ User found:', user.email);

    // Step 2: Check account lockout (exactly like WhatsApp bot)
    console.log('\n🔒 Step 2: Checking account lockout');
    if (user.isAccountLocked()) {
      console.log('❌ Account is locked - this would cause lockout error');
      return;
    }
    console.log('✅ Account not locked');

    // Step 3: Check if user is active (exactly like WhatsApp bot)
    console.log('\n✅ Step 3: Checking if user is active');
    if (!user.isActive) {
      console.log('❌ User is inactive - this would cause inactive error');
      return;
    }
    console.log('✅ User is active');

    // Step 4: Check 2FA (exactly like WhatsApp bot)
    console.log('\n🔐 Step 4: Checking 2FA');
    if (user.twoFactorEnabled) {
      console.log('❌ 2FA is enabled - this would cause 2FA error');
      return;
    }
    console.log('✅ 2FA not enabled');

    // Step 5: Test password comparison (exactly like WhatsApp bot)
    console.log('\n🔑 Step 5: Testing password comparison');
    const isPasswordValid = await user.comparePassword(testPassword);
    if (!isPasswordValid) {
      console.log('❌ Password comparison failed - this would cause "Invalid password" error');
      console.log('This is the issue! The password comparison is failing in WhatsApp bot context.');
      return;
    }
    console.log('✅ Password comparison succeeded');

    console.log('\n🎉 All authentication checks passed!');
    console.log('The issue must be elsewhere in the WhatsApp bot flow.');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the debug
debugWhatsAppDbConnection().catch(console.error);
