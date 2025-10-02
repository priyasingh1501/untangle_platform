require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const { processIncomingMessage } = require('./server/routes/whatsapp');

async function testWebhookMessage() {
  try {
    console.log('🧪 Testing Webhook Message Processing');
    console.log('======================================\n');

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const testPhoneNumber = '919019384482';

    // Test expense message
    const testMessage = {
      from: testPhoneNumber,
      type: 'text',
      text: {
        body: '₹450 Uber ride'
      }
    };

    console.log(`📱 Testing message: "${testMessage.text.body}"`);
    console.log(`📱 From: ${testMessage.from}`);
    
    try {
      await processIncomingMessage(testMessage, {});
      console.log(`✅ Message processed successfully`);
    } catch (error) {
      console.error(`❌ Error processing message:`, error.message);
      console.error('Stack trace:', error.stack);
    }

    // Close connection
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

testWebhookMessage();
