require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const { loginWithCredentials } = require('./server/services/whatsappAuthService');

async function testDirectLogin() {
  try {
    console.log('🧪 Testing Direct Login Function');
    console.log('================================\n');

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test with the test user we just created
    const result = await loginWithCredentials('919805153470', 'whatsapp-test@example.com', 'testpass123');
    
    console.log('📤 Login Result:');
    console.log(JSON.stringify(result, null, 2));

    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error during login test:', error);
    console.error('Stack trace:', error.stack);
  }
}

testDirectLogin();
