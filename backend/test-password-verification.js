#!/usr/bin/env node

// Test Password Verification Directly
const mongoose = require('mongoose');
const User = require('./server/models/User');

async function testPasswordVerification() {
  console.log('🔍 Testing Password Verification Directly');
  console.log('=========================================\n');

  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    const testEmail = 'priya99920@gmail.com';
    const testPassword = 'Priya@123';

    // Find user
    const user = await User.findOne({ email: testEmail });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User found:', user.email);
    console.log('📊 User details:');
    console.log(`   - isActive: ${user.isActive}`);
    console.log(`   - isLocked: ${user.isLocked}`);
    console.log(`   - twoFactorEnabled: ${user.twoFactorEnabled}`);
    console.log(`   - loginAttempts: ${user.loginAttempts}`);
    console.log(`   - password hash: ${user.password.substring(0, 20)}...`);

    // Test password verification
    console.log('\n🔐 Testing password verification:');
    console.log(`   - Input password: "${testPassword}"`);
    
    const isPasswordValid = await user.comparePassword(testPassword);
    console.log(`   - Password valid: ${isPasswordValid}`);

    if (!isPasswordValid) {
      console.log('\n❌ Password verification failed!');
      console.log('🔍 Possible causes:');
      console.log('1. Password hash is corrupted');
      console.log('2. Password comparison method has issues');
      console.log('3. Password was changed on web platform');
      
      // Test with bcrypt directly
      const bcrypt = require('bcrypt');
      const bcryptResult = await bcrypt.compare(testPassword, user.password);
      console.log(`   - Direct bcrypt result: ${bcryptResult}`);
      
    } else {
      console.log('\n✅ Password verification successful!');
      console.log('🤔 This means the issue is elsewhere in the WhatsApp bot flow.');
    }

  } catch (error) {
    console.error('❌ Error testing password verification:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the test
testPasswordVerification().catch(console.error);
