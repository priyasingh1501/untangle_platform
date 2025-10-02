require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const { handleTextMessage } = require('./server/routes/whatsapp');

async function testWhatsAppFlow() {
  try {
    console.log('🧪 Testing Complete WhatsApp Flow');
    console.log('==================================\n');

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const testPhoneNumber = '919019384482';

    // Test different message types
    const testMessages = [
      '₹450 Uber ride',
      'ate breakfast - toast and eggs',
      'meditation done',
      'Feeling good today'
    ];

    for (const message of testMessages) {
      console.log(`\n📱 Testing message: "${message}"`);
      try {
        await handleTextMessage(testPhoneNumber, message);
        console.log(`✅ Message processed successfully`);
      } catch (error) {
        console.error(`❌ Error processing message:`, error.message);
      }
    }

    // Close connection
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

testWhatsAppFlow();
