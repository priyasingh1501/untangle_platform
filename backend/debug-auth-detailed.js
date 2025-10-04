#!/usr/bin/env node

// Detailed Authentication Debug
const mongoose = require('mongoose');
const User = require('./server/models/User');

async function debugAuthDetailed() {
  console.log('🔍 Detailed Authentication Debug');
  console.log('=================================\n');

  const testEmail = 'priya99920@gmail.com';
  const testPassword = 'Priya@123';

  try {
    // Connect to the same database as production
    console.log('🔗 Connecting to production database...');
    await mongoose.connect('mongodb+srv://priya99920_db_user:uirth0hRwtjBs4le@cluster0.dzzxbyq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
    console.log('✅ Connected to database\n');

    // Step 1: Find user by email
    console.log('📧 Step 1: Finding user by email');
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

    // Step 2: Check account lockout
    console.log('\n🔒 Step 2: Checking account lockout');
    const isLocked = user.isAccountLocked();
    console.log(`Account locked: ${isLocked}`);
    if (isLocked) {
      console.log('❌ Account is locked');
      return;
    }

    // Step 3: Check if user is active
    console.log('\n✅ Step 3: Checking if user is active');
    console.log(`User is active: ${user.isActive}`);
    if (!user.isActive) {
      console.log('❌ User account is inactive');
      return;
    }

    // Step 4: Check 2FA
    console.log('\n🔐 Step 4: Checking 2FA');
    console.log(`2FA enabled: ${user.twoFactorEnabled}`);
    if (user.twoFactorEnabled) {
      console.log('❌ 2FA is enabled');
      return;
    }

    // Step 5: Test password comparison
    console.log('\n🔑 Step 5: Testing password comparison');
    console.log('Testing with user.comparePassword() method...');
    const isPasswordValid = await user.comparePassword(testPassword);
    console.log(`Password valid: ${isPasswordValid}`);

    if (!isPasswordValid) {
      console.log('❌ Password comparison failed');
      console.log('This means the password is incorrect or there\'s an issue with password hashing');
      return;
    }

    console.log('\n✅ All authentication checks passed!');
    console.log('The credentials should work in WhatsApp bot.');
    console.log('\n💡 If WhatsApp bot still fails, the issue might be:');
    console.log('1. WhatsApp bot is not using the updated authentication code');
    console.log('2. There\'s a different database connection issue');
    console.log('3. The WhatsApp bot is calling a different authentication function');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the debug
debugAuthDetailed().catch(console.error);
