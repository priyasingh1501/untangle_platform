#!/usr/bin/env node

// Script to link WhatsApp phone number to existing user account
const mongoose = require('mongoose');
const User = require('./server/models/User');
require('dotenv').config();

async function linkWhatsAppUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all WhatsApp users
    const whatsappUsers = await User.find({ 
      email: { $regex: /@whatsapp\.untangle\.com$/ } 
    });
    
    console.log(`\n📱 Found ${whatsappUsers.length} WhatsApp users:`);
    whatsappUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.phoneNumber})`);
    });

    // Find all regular users
    const regularUsers = await User.find({ 
      email: { $not: { $regex: /@whatsapp\.untangle\.com$/ } } 
    });
    
    console.log(`\n👤 Found ${regularUsers.length} regular users:`);
    regularUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.email})`);
    });

    if (whatsappUsers.length === 0) {
      console.log('\n✅ No WhatsApp users found. All messages will create new users automatically.');
      return;
    }

    console.log('\n💡 To link a WhatsApp user to an existing account:');
    console.log('   1. Note the WhatsApp user\'s phone number');
    console.log('   2. Note the regular user\'s email');
    console.log('   3. Run: node link-whatsapp-user.js --link <phone> <email>');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args[0] === '--link' && args[1] && args[2]) {
  const phoneNumber = args[1];
  const email = args[2];
  
  linkWhatsAppToExistingUser(phoneNumber, email);
} else {
  linkWhatsAppUser();
}

async function linkWhatsAppToExistingUser(phoneNumber, email) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find WhatsApp user
    const whatsappUser = await User.findOne({ phoneNumber });
    if (!whatsappUser) {
      console.log(`❌ No WhatsApp user found with phone: ${phoneNumber}`);
      return;
    }
    
    // Find regular user
    const regularUser = await User.findOne({ email });
    if (!regularUser) {
      console.log(`❌ No regular user found with email: ${email}`);
      return;
    }
    
    // Update WhatsApp user to link to regular user
    whatsappUser.email = regularUser.email;
    whatsappUser.name = regularUser.name;
    whatsappUser.linkedUserId = regularUser._id;
    await whatsappUser.save();
    
    console.log(`✅ Linked WhatsApp user ${phoneNumber} to ${email}`);
    console.log(`   WhatsApp user now uses regular user's email and name`);
    
  } catch (error) {
    console.error('❌ Error linking users:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}
