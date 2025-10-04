#!/usr/bin/env node

// Unlock User Account
const mongoose = require('mongoose');
const User = require('./server/models/User');

async function unlockAccount() {
  console.log('🔓 Unlocking User Account');
  console.log('========================\n');

  const testEmail = 'priya99920@gmail.com';

  try {
    // Connect to the same database as production
    console.log('🔗 Connecting to production database...');
    await mongoose.connect('mongodb+srv://priya99920_db_user:uirth0hRwtjBs4le@cluster0.dzzxbyq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
    console.log('✅ Connected to database\n');

    // Find user
    console.log('📧 Finding user...');
    const user = await User.findOne({ email: testEmail.toLowerCase() });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('🔍 Current account status:');
    console.log(`- Locked: ${user.isLocked}`);
    console.log(`- Locked until: ${user.lockedUntil}`);
    console.log(`- Login attempts: ${user.loginAttempts}`);

    // Unlock the account
    console.log('\n🔓 Unlocking account...');
    user.unlockAccount(); // This sets isLocked: false, lockedUntil: null, loginAttempts: 0
    await user.save();

    console.log('✅ Account unlocked successfully!');
    console.log('\n📋 New account status:');
    console.log(`- Locked: ${user.isLocked}`);
    console.log(`- Locked until: ${user.lockedUntil}`);
    console.log(`- Login attempts: ${user.loginAttempts}`);

    console.log('\n🎉 You can now try logging into WhatsApp bot again!');

  } catch (error) {
    console.error('❌ Unlock failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the unlock
unlockAccount().catch(console.error);
