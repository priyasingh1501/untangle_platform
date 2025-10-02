require('dotenv').config({ path: './.env' });
const { sendMessage } = require('./server/services/whatsappService');

async function testSendToYourNumber() {
  try {
    console.log('🧪 Testing Send Message to Your Number');
    console.log('=======================================\n');

    const yourPhoneNumber = '9805153470';
    const testMessage = 'Hello! This is a test message from the WhatsApp bot.';

    console.log(`📤 Sending message to ${yourPhoneNumber}: "${testMessage}"`);
    
    try {
      const result = await sendMessage(yourPhoneNumber, testMessage);
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

testSendToYourNumber();
