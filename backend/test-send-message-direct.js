require('dotenv').config({ path: './.env' });
const { sendMessage } = require('./server/services/whatsappService');

async function testSendMessage() {
  try {
    console.log('🧪 Testing Send Message Function');
    console.log('==================================\n');

    const testPhoneNumber = '919019384482';
    const testMessage = 'Test message from bot';

    console.log(`📤 Sending message to ${testPhoneNumber}: "${testMessage}"`);
    
    try {
      const result = await sendMessage(testPhoneNumber, testMessage);
      console.log(`✅ Message sent successfully:`, result);
    } catch (error) {
      console.error(`❌ Error sending message:`, error.message);
      console.error('Stack trace:', error.stack);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

testSendMessage();
