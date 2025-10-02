require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const { classifyMessage, parseExpense } = require('./server/services/messageParsingService');

async function testComplexExpenses() {
  try {
    console.log('🧪 Testing Complex Expense Parsing');
    console.log('==================================\n');

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test complex expense messages
    const complexExpenses = [
      '₹450 Uber ride to airport',
      '1200 Swiggy order - biryani and naan',
      'spent 2500 on groceries at Big Bazaar',
      'paid 5000 rent for October',
      '₹800 movie tickets at PVR',
      '1500 fuel at Shell petrol pump',
      '₹300 coffee at Starbucks',
      '2000 Amazon purchase - phone case',
      'paid 1200 electricity bill',
      '₹600 lunch at McDonald\'s'
    ];

    for (const message of complexExpenses) {
      console.log(`\n📝 Testing: "${message}"`);
      
      // Test classification
      const classification = await classifyMessage(message);
      console.log(`🔍 Classification: ${classification.type} (confidence: ${classification.confidence})`);
      
      // Test expense parsing
      const expenseData = await parseExpense(message);
      if (expenseData) {
        console.log(`💰 Parsed Expense:`);
        console.log(`   Amount: ${expenseData.currency}${expenseData.amount}`);
        console.log(`   Vendor: ${expenseData.vendor}`);
        console.log(`   Category: ${expenseData.category}`);
        console.log(`   Description: ${expenseData.description}`);
        console.log(`   Date: ${expenseData.date.toLocaleDateString()}`);
      } else {
        console.log(`❌ Failed to parse expense`);
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

testComplexExpenses();
