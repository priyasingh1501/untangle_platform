const { classifyMessage, parseExpense, parseFood, parseHabit, parseJournal } = require('./server/services/messageParsingService');

// Test the message parsing functionality
async function testMessageParsing() {
  console.log('🧪 Testing WhatsApp Bot Message Parsing\n');

  const testMessages = [
    // Expense messages
    '₹450 Uber 2025-09-27',
    '1200 swiggy',
    '$25.50 Amazon',
    '500 rupees ola',
    
    // Food messages
    'ate breakfast - toast and eggs',
    'lunch at office canteen',
    'dinner with family',
    'snack - apple and nuts',
    
    // Habit messages
    'meditation done',
    'skipped workout',
    'exercise 30 min',
    'reading completed',
    
    // Journal messages
    'Frustrated at work but I handled it calmly',
    'Grateful for my family today',
    'Had a great day at the beach',
    'Feeling anxious about the presentation tomorrow'
  ];

  for (const message of testMessages) {
    console.log(`\n📝 Testing: "${message}"`);
    
    try {
      // Test classification
      const classification = await classifyMessage(message);
      console.log(`   Classification: ${classification.type} (confidence: ${classification.confidence})`);
      
      // Test parsing based on classification
      let parsedData = null;
      switch (classification.type) {
        case 'expense':
          parsedData = await parseExpense(message);
          break;
        case 'food':
          parsedData = await parseFood(message);
          break;
        case 'habit':
          parsedData = await parseHabit(message);
          break;
        case 'journal':
          parsedData = await parseJournal(message);
          break;
      }
      
      if (parsedData) {
        console.log(`   Parsed data:`, JSON.stringify(parsedData, null, 2));
      } else {
        console.log(`   ❌ Failed to parse data`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

// Test the fallback parsing functions
function testFallbackParsing() {
  console.log('\n🔄 Testing Fallback Parsing Functions\n');

  const testCases = [
    { message: '₹450 Uber', type: 'expense' },
    { message: 'ate breakfast', type: 'food' },
    { message: 'meditation done', type: 'habit' },
    { message: 'Feeling good today', type: 'journal' }
  ];

  for (const testCase of testCases) {
    console.log(`\n📝 Testing fallback for: "${testCase.message}"`);
    
    try {
      let result = null;
      switch (testCase.type) {
        case 'expense':
          result = parseExpenseFallback(testCase.message);
          break;
        case 'food':
          result = parseFoodFallback(testCase.message);
          break;
        case 'habit':
          result = parseHabitFallback(testCase.message);
          break;
        case 'journal':
          result = parseJournalFallback(testCase.message);
          break;
      }
      
      if (result) {
        console.log(`   Result:`, JSON.stringify(result, null, 2));
      } else {
        console.log(`   ❌ No result`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
}

// Import fallback functions for testing
const { 
  parseExpenseFallback, 
  parseFoodFallback, 
  parseHabitFallback, 
  parseJournalFallback 
} = require('./server/services/messageParsingService');

// Run tests
async function runTests() {
  console.log('🚀 Starting WhatsApp Bot Tests\n');
  
  try {
    await testMessageParsing();
    testFallbackParsing();
    
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testMessageParsing, testFallbackParsing };
