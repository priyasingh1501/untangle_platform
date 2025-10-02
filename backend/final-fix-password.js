require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./server/models/User');

async function finalFixPassword() {
  try {
    console.log('🔧 Final Password Fix');
    console.log('=====================\n');

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
    console.log(`🔐 Current password hash: ${user.password}`);

    // Create a fresh hash with the exact password we want
    const testPassword = 'testpass123';
    console.log(`🔍 Creating hash for password: "${testPassword}"`);
    
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log(`🆕 New password hash: ${newHash}`);

    // Test the new hash immediately
    const testComparison = await bcrypt.compare(testPassword, newHash);
    console.log(`🧪 Test comparison with new hash: ${testComparison}`);

    if (!testComparison) {
      console.log('❌ New hash test failed! Something is wrong with bcrypt.');
      return;
    }

    // Update the user's password
    user.password = newHash;
    await user.save();
    console.log('✅ Updated user password in database');

    // Verify the saved password works
    const savedUser = await User.findOne({ email: 'whatsapp-test@example.com' });
    const finalTest = await bcrypt.compare(testPassword, savedUser.password);
    console.log(`🔍 Final verification: ${finalTest ? '✅ SUCCESS' : '❌ FAILED'}`);

    if (finalTest) {
      console.log('\n🎉 Password fix successful!');
      console.log('📋 Test User Details:');
      console.log('Email: whatsapp-test@example.com');
      console.log('Password: testpass123');
      console.log('\n💡 You can now test login with:');
      console.log('login whatsapp-test@example.com testpass123');
    }

    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error fixing password:', error);
    console.error('Stack trace:', error.stack);
  }
}

finalFixPassword();
