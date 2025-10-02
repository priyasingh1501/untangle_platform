require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const User = require('./server/models/User');

async function checkUsers() {
  try {
    console.log('🔍 Checking Users in Database');
    console.log('==============================\n');

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all users
    const users = await User.find({}, 'email firstName lastName isActive').limit(10);
    
    console.log(`📊 Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Active: ${user.isActive}`);
      console.log('');
    });

    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error checking users:', error);
    console.error('Stack trace:', error.stack);
  }
}

checkUsers();
