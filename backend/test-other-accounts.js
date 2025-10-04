#!/usr/bin/env node

// Test Other Accounts Authentication
const mongoose = require('mongoose');
const User = require('./server/models/User');

async function testOtherAccounts() {
  console.log('🔍 Testing Other Accounts Authentication');
  console.log('========================================\n');

  try {
    // Connect to the same database as production
    console.log('🔗 Connecting to production database...');
    await mongoose.connect('mongodb+srv://priya99920_db_user:uirth0hRwtjBs4le@cluster0.dzzxbyq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');
    console.log('✅ Connected to database\n');

    // Find all users
    console.log('👥 Finding all users in database...');
    const users = await User.find({}).select('email firstName lastName isActive isLocked lockedUntil loginAttempts twoFactorEnabled source createdAt');
    
    console.log(`Found ${users.length} users:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   - Name: ${user.firstName} ${user.lastName}`);
      console.log(`   - Active: ${user.isActive}`);
      console.log(`   - Locked: ${user.isLocked}`);
      console.log(`   - Locked Until: ${user.lockedUntil || 'N/A'}`);
      console.log(`   - Login Attempts: ${user.loginAttempts}`);
      console.log(`   - 2FA Enabled: ${user.twoFactorEnabled}`);
      console.log(`   - Source: ${user.source}`);
      console.log(`   - Created: ${user.createdAt}`);
      console.log('');
    });

    // Test a few accounts
    console.log('🧪 Testing authentication for non-locked accounts...');
    const testableUsers = users.filter(user => 
      user.isActive && 
      !user.isLocked && 
      !user.twoFactorEnabled && 
      user.source === 'web'
    );

    if (testableUsers.length === 0) {
      console.log('❌ No testable accounts found (all are locked, inactive, or have 2FA)');
    } else {
      console.log(`Found ${testableUsers.length} testable accounts:`);
      testableUsers.forEach(user => {
        console.log(`- ${user.email}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the test
testOtherAccounts().catch(console.error);
