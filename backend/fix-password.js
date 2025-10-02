require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./server/models/User');

async function fixPassword() {
  try {
    console.log('🔧 Fixing Password Hash');
    console.log('========================\n');

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the test user
    const user = await User.findOne({ email: 'whatsapp-test@example.com' });
    if (!user) {
      console.log('❌ User whatsapp-test@example.com not found');
      return;
    }

    console.log(`👤 Found user: ${user.email}`);
    console.log(`🔐 Old password hash: ${user.password}`);

    // Create a fresh hash
    const testPassword = 'testpass123';
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log(`🆕 New password hash: ${newHash}`);

    // Update the user's password
    user.password = newHash;
    await user.save();
    console.log('✅ Updated user password');

    // Verify the new password works
    const isValid = await bcrypt.compare(testPassword, user.password);
    console.log(`🔍 Verification: ${isValid ? '✅ SUCCESS' : '❌ FAILED'}`);

    console.log('\n📋 Test User Details:');
    console.log('Email: whatsapp-test@example.com');
    console.log('Password: testpass123');
    console.log('\n💡 You can now test login with:');
    console.log('login whatsapp-test@example.com testpass123');

    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error fixing password:', error);
    console.error('Stack trace:', error.stack);
  }
}

fixPassword();
