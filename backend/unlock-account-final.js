#!/usr/bin/env node

// Unlock Account - Final Fix
const mongoose = require('mongoose');
const User = require('./server/models/User');

async function unlockAccount() {
  console.log('🔓 Unlocking Account - Final Fix');
  console.log('=================================\n');

  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // Find the user
    const user = await User.findOne({ email: 'priya99920@gmail.com' });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User found:', user.email);
    console.log('📊 Current account status:');
    console.log(`   - isLocked: ${user.isLocked}`);
    console.log(`   - lockedUntil: ${user.lockedUntil}`);
    console.log(`   - loginAttempts: ${user.loginAttempts}`);
    console.log(`   - failedLoginAttempts: ${user.failedLoginAttempts?.length || 0}`);

    // Unlock the account
    user.isLocked = false;
    user.lockedUntil = null;
    user.loginAttempts = 0;
    user.failedLoginAttempts = [];
    
    await user.save();
    console.log('✅ Account unlocked successfully!');

    // Verify the unlock
    const updatedUser = await User.findOne({ email: 'priya99920@gmail.com' });
    console.log('\n📊 Updated account status:');
    console.log(`   - isLocked: ${updatedUser.isLocked}`);
    console.log(`   - lockedUntil: ${updatedUser.lockedUntil}`);
    console.log(`   - loginAttempts: ${updatedUser.loginAttempts}`);
    console.log(`   - failedLoginAttempts: ${updatedUser.failedLoginAttempts?.length || 0}`);

    console.log('\n🎉 Account is now unlocked!');
    console.log('📱 You can now try logging in via WhatsApp bot again.');

  } catch (error) {
    console.error('❌ Error unlocking account:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the unlock
unlockAccount().catch(console.error);
