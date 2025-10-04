#!/usr/bin/env node

// Deep Debug WhatsApp Authentication
const mongoose = require('mongoose');
const User = require('./server/models/User');

async function debugWhatsAppAuthDeep() {
  console.log('🔍 Deep Debug WhatsApp Authentication');
  console.log('=====================================\n');

  const testEmail = 'priya99920@gmail.com';
  const testPassword = 'Priya@123';

  try {
    // Connect to the same database as production
    console.log('🔗 Connecting to production database...');
    await mongoose.connect('mongodb+srv://priya99920_db_user:uirth0hRwtjBs4le@cluster0.dzzxbyq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
    console.log('✅ Connected to database\n');

    // Step 1: Find user by email (exactly like WhatsApp bot does)
    console.log('📧 Step 1: Finding user by email (lowercase)');
    const user = await User.findOne({ email: testEmail.toLowerCase() });
    if (!user) {
      console.log('❌ User not found in database');
      return;
    }
    console.log('✅ User found:', {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      isLocked: user.isLocked,
      lockedUntil: user.lockedUntil,
      loginAttempts: user.loginAttempts,
      twoFactorEnabled: user.twoFactorEnabled,
      source: user.source
    });

    // Step 2: Check account lockout (exactly like WhatsApp bot does)
    console.log('\n🔒 Step 2: Checking account lockout');
    const isLocked = user.isAccountLocked();
    console.log(`Account locked: ${isLocked}`);
    if (isLocked) {
      console.log('❌ Account is locked - this would cause login failure');
      console.log(`Locked until: ${user.lockedUntil}`);
      return;
    }

    // Step 3: Check if user is active (exactly like WhatsApp bot does)
    console.log('\n✅ Step 3: Checking if user is active');
    console.log(`User is active: ${user.isActive}`);
    if (!user.isActive) {
      console.log('❌ User account is inactive - this would cause login failure');
      return;
    }

    // Step 4: Check 2FA (exactly like WhatsApp bot does)
    console.log('\n🔐 Step 4: Checking 2FA');
    console.log(`2FA enabled: ${user.twoFactorEnabled}`);
    if (user.twoFactorEnabled) {
      console.log('❌ 2FA is enabled - this would cause login failure');
      return;
    }

    // Step 5: Test password comparison (exactly like WhatsApp bot does)
    console.log('\n🔑 Step 5: Testing password comparison');
    console.log('Testing with user.comparePassword() method...');
    const isPasswordValid = await user.comparePassword(testPassword);
    console.log(`Password valid: ${isPasswordValid}`);

    if (!isPasswordValid) {
      console.log('❌ Password comparison failed');
      console.log('This means the password is incorrect or there\'s an issue with password hashing');
      
      // Let's check the password hash
      console.log('\n🔍 Password hash analysis:');
      console.log(`Password hash exists: ${!!user.password}`);
      console.log(`Password hash length: ${user.password ? user.password.length : 0}`);
      console.log(`Password hash starts with: ${user.password ? user.password.substring(0, 10) : 'N/A'}...`);
      
      return;
    }

    console.log('\n✅ All authentication checks passed!');
    console.log('The credentials should work in WhatsApp bot.');
    console.log('\n💡 If WhatsApp bot still fails after this, the issue might be:');
    console.log('1. WhatsApp bot is not using the updated authentication code');
    console.log('2. There\'s a different database connection in WhatsApp bot');
    console.log('3. The WhatsApp bot is calling a different authentication function');
    console.log('4. There\'s an error in the WhatsApp authentication flow');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the debug
debugWhatsAppAuthDeep().catch(console.error);
