require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const { saveExpense } = require('./server/services/dataService');

async function testExpenseSave() {
  try {
    console.log('🧪 Testing Expense Save Function');
    console.log('================================\n');

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test expense data
    const testExpenseData = {
      amount: 450,
      currency: 'INR',
      vendor: 'Uber',
      date: new Date(),
      category: 'transportation',
      description: 'Uber ride to airport',
      source: 'whatsapp'
    };

    const testPhoneNumber = '919019384482';

    console.log(`📝 Testing expense save for phone: ${testPhoneNumber}`);
    console.log(`💰 Expense data:`, testExpenseData);

    // Test saving expense
    const savedExpense = await saveExpense(testPhoneNumber, testExpenseData);
    console.log(`✅ Successfully saved expense:`, savedExpense);

    // Close connection
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

testExpenseSave();
