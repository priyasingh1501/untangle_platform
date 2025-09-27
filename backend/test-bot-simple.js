// Simple WhatsApp Bot Test (without OpenAI dependency)
// This tests the basic functionality without requiring API keys

console.log('🧪 Testing WhatsApp Bot Basic Functionality\n');

// Test fallback parsing functions
function testFallbackParsing() {
  console.log('🔄 Testing Fallback Parsing Functions\n');

  // Simple regex-based parsing for testing
  function parseExpenseFallback(messageText) {
    const text = messageText.trim();
    
    // Try to extract amount and vendor using regex
    const currencyMatch = text.match(/[₹$€£¥](\d+)/);
    const numberMatch = text.match(/(\d+)/);
    const amount = currencyMatch ? parseFloat(currencyMatch[1]) : (numberMatch ? parseFloat(numberMatch[1]) : null);
    
    if (!amount) return null;
    
    // Extract vendor (everything except amount and date)
    const vendorMatch = text.replace(/[₹$€£¥]?\d+/, '').replace(/\d{4}-\d{2}-\d{2}/, '').trim();
    const vendor = vendorMatch || 'Unknown';
    
    // Determine category based on vendor
    let category = 'other';
    if (vendor.toLowerCase().includes('uber') || vendor.toLowerCase().includes('ola')) {
      category = 'transportation';
    } else if (vendor.toLowerCase().includes('swiggy') || vendor.toLowerCase().includes('zomato')) {
      category = 'food';
    }
    
    return {
      amount,
      currency: 'INR',
      vendor,
      date: new Date(),
      category,
      description: `${vendor} expense`,
      source: 'whatsapp'
    };
  }

  function parseFoodFallback(messageText) {
    const text = messageText.toLowerCase();
    
    let mealType = 'snack';
    if (text.includes('breakfast')) mealType = 'breakfast';
    else if (text.includes('lunch')) mealType = 'lunch';
    else if (text.includes('dinner')) mealType = 'dinner';
    
    // Extract description (everything after "ate" or meal type)
    const description = text.replace(/(ate|breakfast|lunch|dinner|snack)\s*-?\s*/, '').trim() || 'food';
    
    return {
      mealType,
      description,
      calories: null,
      time: null,
      source: 'whatsapp'
    };
  }

  function parseHabitFallback(messageText) {
    const text = messageText.toLowerCase();
    
    let status = 'completed';
    if (text.includes('skipped') || text.includes('missed')) {
      status = 'skipped';
    }
    
    // Extract habit name (remove status words)
    const habit = text.replace(/(done|completed|skipped|missed)/g, '').trim() || 'habit';
    
    // Extract duration if mentioned
    const durationMatch = text.match(/(\d+)\s*(min|minutes?|hour|hours?)/);
    const duration = durationMatch ? parseInt(durationMatch[1]) : null;
    
    return {
      habit,
      status,
      duration,
      notes: null,
      source: 'whatsapp'
    };
  }

  function parseJournalFallback(messageText) {
    const text = messageText.toLowerCase();
    
    // Determine mood based on keywords
    let mood = 'neutral';
    if (text.includes('happy') || text.includes('great') || text.includes('awesome') || text.includes('excellent')) {
      mood = 'excellent';
    } else if (text.includes('good') || text.includes('nice') || text.includes('grateful')) {
      mood = 'good';
    } else if (text.includes('bad') || text.includes('terrible') || text.includes('awful')) {
      mood = 'bad';
    } else if (text.includes('worst') || text.includes('horrible')) {
      mood = 'terrible';
    }
    
    // Determine type based on keywords
    let type = 'daily';
    if (text.includes('grateful') || text.includes('thankful')) {
      type = 'gratitude';
    } else if (text.includes('work') || text.includes('job') || text.includes('office')) {
      type = 'work';
    } else if (text.includes('health') || text.includes('exercise') || text.includes('doctor')) {
      type = 'health';
    } else if (text.includes('family') || text.includes('friend') || text.includes('relationship')) {
      type = 'relationship';
    }
    
    return {
      title: messageText.substring(0, 50),
      content: messageText,
      mood,
      type,
      source: 'whatsapp'
    };
  }

  // Test cases
  const testCases = [
    { message: '₹450 Uber', type: 'expense', parser: parseExpenseFallback },
    { message: 'ate breakfast - toast and eggs', type: 'food', parser: parseFoodFallback },
    { message: 'meditation done', type: 'habit', parser: parseHabitFallback },
    { message: 'Feeling good today', type: 'journal', parser: parseJournalFallback },
    { message: '1200 swiggy', type: 'expense', parser: parseExpenseFallback },
    { message: 'skipped workout', type: 'habit', parser: parseHabitFallback },
    { message: 'Grateful for my family', type: 'journal', parser: parseJournalFallback }
  ];

  for (const testCase of testCases) {
    console.log(`📝 Testing: "${testCase.message}"`);
    
    try {
      const result = testCase.parser(testCase.message);
      
      if (result) {
        console.log(`   ✅ Parsed as ${testCase.type}:`, JSON.stringify(result, null, 2));
      } else {
        console.log(`   ❌ Failed to parse`);
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log('');
  }
}

// Test message classification
function testMessageClassification() {
  console.log('🔍 Testing Message Classification\n');

  const testMessages = [
    '₹450 Uber 2025-09-27',
    'ate breakfast - toast and eggs',
    'meditation done',
    'Feeling good today',
    '1200 swiggy',
    'skipped workout',
    'Grateful for my family',
    'random text that doesn\'t make sense'
  ];

  function classifyMessageFallback(messageText) {
    const text = messageText.toLowerCase();
    
    // Check for expense indicators
    if (text.match(/[₹$€£¥]|\d+\s*(rupees?|dollars?|euros?|pounds?)/) || 
        text.match(/\d+\s+(uber|ola|swiggy|zomato|amazon|flipkart)/)) {
      return { type: 'expense', confidence: 0.8, reasoning: 'Contains currency or merchant keywords' };
    }
    
    // Check for food indicators
    if (text.match(/(ate|eating|breakfast|lunch|dinner|snack|food|meal)/) ||
        text.match(/(swiggy|zomato|foodpanda|ubereats)/)) {
      return { type: 'food', confidence: 0.8, reasoning: 'Contains food-related keywords' };
    }
    
    // Check for habit indicators
    if (text.match(/(did|done|completed|skipped|streak|habit|exercise|meditation|workout)/)) {
      return { type: 'habit', confidence: 0.7, reasoning: 'Contains habit-related keywords' };
    }
    
    // Default to journal
    return { type: 'journal', confidence: 0.6, reasoning: 'Default classification' };
  }

  for (const message of testMessages) {
    console.log(`📝 Testing: "${message}"`);
    const classification = classifyMessageFallback(message);
    console.log(`   Classification: ${classification.type} (confidence: ${classification.confidence})`);
    console.log(`   Reasoning: ${classification.reasoning}`);
    console.log('');
  }
}

// Test WhatsApp message format
function testWhatsAppMessageFormat() {
  console.log('📱 Testing WhatsApp Message Format\n');

  const sampleWebhookMessage = {
    object: 'whatsapp_business_account',
    entry: [{
      changes: [{
        value: {
          messages: [{
            from: '1234567890',
            text: { body: '₹450 Uber 2025-09-27' },
            type: 'text'
          }],
          metadata: {
            phone_number_id: '123456789012345'
          }
        },
        field: 'messages'
      }]
    }]
  };

  console.log('Sample webhook message:');
  console.log(JSON.stringify(sampleWebhookMessage, null, 2));
  console.log('');

  // Test message extraction
  const message = sampleWebhookMessage.entry[0].changes[0].value.messages[0];
  const phoneNumber = message.from;
  const messageText = message.text?.body || '';
  const messageType = message.type;

  console.log('Extracted data:');
  console.log(`   Phone: ${phoneNumber}`);
  console.log(`   Text: ${messageText}`);
  console.log(`   Type: ${messageType}`);
  console.log('');
}

// Run all tests
function runAllTests() {
  console.log('🚀 Starting WhatsApp Bot Basic Tests\n');
  console.log('=====================================\n');
  
  testMessageClassification();
  testFallbackParsing();
  testWhatsAppMessageFormat();
  
  console.log('✅ All basic tests completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Set up your environment variables (.env file)');
  console.log('2. Get your WhatsApp Business API credentials');
  console.log('3. Configure your webhook');
  console.log('4. Test with real WhatsApp messages');
  console.log('\n📚 See QUICK_SETUP_GUIDE.md for detailed instructions');
}

// Run tests
runAllTests();
