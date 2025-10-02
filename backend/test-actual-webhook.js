require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('./server/index');

async function testActualWebhook() {
  try {
    console.log('🧪 Testing Actual Webhook Endpoint');
    console.log('===================================\n');

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const testPhoneNumber = '919019384482';

    // Test expense message webhook payload
    const webhookPayload = {
      object: 'whatsapp_business_account',
      entry: [{
        id: '123456789',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15556324225',
              phone_number_id: '123456789'
            },
            messages: [{
              from: testPhoneNumber,
              id: 'wamid.test123',
              timestamp: '1640995200',
              type: 'text',
              text: {
                body: '₹450 Uber ride'
              }
            }]
          },
          field: 'messages'
        }]
      }]
    };

    console.log(`📱 Testing webhook with message: "${webhookPayload.entry[0].changes[0].value.messages[0].text.body}"`);
    
    try {
      const response = await request(app)
        .post('/api/whatsapp/webhook')
        .send(webhookPayload)
        .expect(200);
      
      console.log(`✅ Webhook processed successfully`);
      console.log(`📤 Response:`, response.body);
    } catch (error) {
      console.error(`❌ Error processing webhook:`, error.message);
      if (error.response) {
        console.error('Response body:', error.response.body);
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

testActualWebhook();
