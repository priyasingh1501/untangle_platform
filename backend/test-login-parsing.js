#!/usr/bin/env node

// Test Login Command Parsing
function testLoginParsing() {
  console.log('🔍 Testing Login Command Parsing');
  console.log('================================\n');

  const testCommands = [
    'login priya99920@gmail.com Priya@123',
    'LOGIN priya99920@gmail.com Priya@123',
    'Login priya99920@gmail.com Priya@123',
    'login PRIYA99920@GMAIL.COM Priya@123',
    'login priya99920@GMAIL.COM Priya@123'
  ];

  testCommands.forEach((command, index) => {
    console.log(`Test ${index + 1}: "${command}"`);
    
    // Simulate the WhatsApp bot parsing logic
    const text = command.toLowerCase().trim();
    console.log(`  Lowercase: "${text}"`);
    
    if (text.startsWith('login ')) {
      const loginParts = text.substring(6).trim().split(' ');
      console.log(`  Login parts: [${loginParts.map(p => `"${p}"`).join(', ')}]`);
      
      if (loginParts.length >= 2) {
        const email = loginParts[0];
        const password = loginParts.slice(1).join(' ');
        console.log(`  Extracted email: "${email}"`);
        console.log(`  Extracted password: "${password}"`);
        
        // Check if email is lowercase (this might be the issue!)
        if (email === email.toLowerCase()) {
          console.log(`  ⚠️  Email is lowercase: "${email}"`);
        } else {
          console.log(`  ✅ Email preserves case: "${email}"`);
        }
      }
    }
    console.log('');
  });

  console.log('💡 If the email is being converted to lowercase, this might be the issue!');
  console.log('💡 The database lookup uses email.toLowerCase(), so this should be fine.');
  console.log('💡 But let\'s verify the actual parsing logic...');
}

// Run the test
testLoginParsing();
