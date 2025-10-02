require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./server/models/User');

async function debugPassword() {
  try {
    console.log('🔍 Debugging Password Issue');
    console.log('============================\n');

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
    console.log(`🔐 Password hash: ${user.password}`);
    console.log(`📏 Hash length: ${user.password.length}`);

    // Test password comparison
    const testPassword = 'testpass123';
    console.log(`\n🔍 Testing password: "${testPassword}"`);
    
    const isValid = await bcrypt.compare(testPassword, user.password);
    console.log(`✅ Password comparison result: ${isValid}`);

    // Let's also test creating a new hash and comparing
    console.log('\n🔄 Creating new hash and comparing...');
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log(`📝 New hash: ${newHash}`);
    
    const newComparison = await bcrypt.compare(testPassword, newHash);
    console.log(`✅ New hash comparison: ${newComparison}`);

    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error debugging password:', error);
    console.error('Stack trace:', error.stack);
  }
}

debugPassword();
