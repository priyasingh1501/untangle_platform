require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./server/models/User');

async function createTestUser() {
  try {
    console.log('👤 Creating Test User for WhatsApp Login');
    console.log('========================================\n');

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'whatsapp-test@example.com' });
    if (existingUser) {
      console.log('👤 User already exists, updating password...');
      existingUser.password = await bcrypt.hash('testpass123', 10);
      await existingUser.save();
      console.log('✅ Updated password for existing user');
    } else {
      // Create new test user
      const hashedPassword = await bcrypt.hash('testpass123', 10);
      
      const newUser = new User({
        email: 'whatsapp-test@example.com',
        password: hashedPassword,
        firstName: 'WhatsApp',
        lastName: 'Test',
        name: 'WhatsApp Test User',
        isActive: true,
        source: 'web'
      });

      await newUser.save();
      console.log('✅ Created new test user');
    }

    console.log('\n📋 Test User Details:');
    console.log('Email: whatsapp-test@example.com');
    console.log('Password: testpass123');
    console.log('\n💡 You can now test login with:');
    console.log('login whatsapp-test@example.com testpass123');

    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    console.error('Stack trace:', error.stack);
  }
}

createTestUser();
