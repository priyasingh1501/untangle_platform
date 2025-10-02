require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const { classifyMessage, parseExpense } = require('./server/services/messageParsingService');

async function testMessageParsing() {
  try {
    console.log('🧪 Testing Message Parsing');
    console.log('===========================\n');

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test messages
    const testMessages = [
      'expense 50 coffee',
      '₹75 lunch',
      'spent 100 on groceries',
      'ate breakfast',
      'meditation done',
      'feeling great today'
    ];

    for (const message of testMessages) {
      console.log(`\n📝 Testing: "${message}"`);
      
      // Test classification
      const classification = await classifyMessage(message);
      console.log(`🔍 Classification: ${classification.type} (confidence: ${classification.confidence})`);
      
      // Test expense parsing if classified as expense
      if (classification.type === 'expense') {
        const expenseData = await parseExpense(message);
        console.log(`💰 Expense Data:`, expenseData);
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

testMessageParsing();
