require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./server/models/User');

async function bypassHashUpdate() {
  try {
    console.log('🔧 Bypassing Hash Hook - Direct Database Update');
    console.log('===============================================\n');

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create the hash we want
    const testPassword = 'testpass123';
    const desiredHash = await bcrypt.hash(testPassword, 10);
    console.log(`🔐 Creating hash for password: "${testPassword}"`);
    console.log(`📝 Desired hash: ${desiredHash}`);

    // Test the hash works
    const testComparison = await bcrypt.compare(testPassword, desiredHash);
    console.log(`🧪 Hash test: ${testComparison ? '✅ SUCCESS' : '❌ FAILED'}`);

    if (!testComparison) {
      console.log('❌ Hash creation failed!');
      return;
    }

    // Update directly in the database collection to bypass the pre-save hook
    const result = await User.collection.updateOne(
      { email: 'whatsapp-test@example.com' },
      { $set: { password: desiredHash } }
    );

    console.log(`📊 Update result: ${result.modifiedCount} document(s) modified`);

    // Verify the update worked
    const updatedUser = await User.findOne({ email: 'whatsapp-test@example.com' });
    const finalTest = await bcrypt.compare(testPassword, updatedUser.password);
    console.log(`🔍 Final verification: ${finalTest ? '✅ SUCCESS' : '❌ FAILED'}`);

    if (finalTest) {
      console.log('\n🎉 Password update successful!');
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
    console.error('❌ Error updating password:', error);
    console.error('Stack trace:', error.stack);
  }
}

bypassHashUpdate();
