require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const { Expense } = require('./server/models/Finance');

async function checkSavedExpenses() {
  try {
    console.log('🔍 Checking Saved Expenses');
    console.log('==========================\n');

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all expenses for the test phone number user
    const expenses = await Expense.find({}).sort({ createdAt: -1 }).limit(10);
    
    console.log(`📊 Found ${expenses.length} recent expenses:`);
    
    expenses.forEach((expense, index) => {
      console.log(`\n${index + 1}. Expense ID: ${expense._id}`);
      console.log(`   Amount: ${expense.currency}${expense.amount}`);
      console.log(`   Vendor: ${expense.vendor}`);
      console.log(`   Category: ${expense.category}`);
      console.log(`   Description: ${expense.description}`);
      console.log(`   Source: ${expense.source}`);
      console.log(`   Created: ${expense.createdAt.toLocaleString()}`);
    });

    // Close connection
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Check failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

checkSavedExpenses();
