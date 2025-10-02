require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./server/models/User');

async function testLoginWithRealUser() {
  try {
    console.log('🧪 Testing Login with Real User');
    console.log('===============================\n');

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get the test user
    const user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      console.log('❌ User test@example.com not found');
      return;
    }

    console.log(`👤 Found user: ${user.email}`);
    console.log(`📝 Name: ${user.firstName} ${user.lastName}`);
    console.log(`🔐 Has password: ${!!user.password}`);

    // Test with common passwords
    const testPasswords = ['password', 'password123', 'test123', '123456', 'test'];
    
    for (const password of testPasswords) {
      const isValid = await bcrypt.compare(password, user.password);
      console.log(`🔍 Testing password "${password}": ${isValid ? '✅ VALID' : '❌ Invalid'}`);
      if (isValid) {
        console.log(`🎉 Found correct password: "${password}"`);
        break;
      }
    }

    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error testing login:', error);
    console.error('Stack trace:', error.stack);
  }
}

testLoginWithRealUser();
