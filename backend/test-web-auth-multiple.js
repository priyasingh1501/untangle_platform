#!/usr/bin/env node

// Test Web Authentication with Multiple Accounts
const fetch = require('node-fetch');

async function testWebAuthMultiple() {
  console.log('🧪 Testing Web Authentication with Multiple Accounts');
  console.log('==================================================\n');

  const apiUrl = 'https://lyfe-production.up.railway.app/api/auth/login';
  
  // Test accounts (you'll need to provide passwords for these)
  const testAccounts = [
    { email: 'testuser@example.com', password: 'password123' },
    { email: 'test@example.com', password: 'password123' },
    { email: 'priya1@gmail.com', password: 'Priya@123' },
    { email: 'newuser@example.com', password: 'password123' },
    { email: 'aaa@gmail.com', password: 'Priya@123' }
  ];

  console.log('⚠️  These are common passwords - update with actual passwords if needed\n');

  for (const account of testAccounts) {
    try {
      console.log(`📧 Testing: ${account.email}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: account.email,
          password: account.password
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ SUCCESS: ${account.email} - Login successful`);
      } else {
        console.log(`❌ FAILED: ${account.email} - ${result.message || 'Login failed'}`);
      }
      
      await sleep(1000); // Wait 1 second between requests
      
    } catch (error) {
      console.error(`❌ ERROR: ${account.email} - ${error.message}`);
    }
  }

  console.log('\n✅ Web authentication test completed!');
  console.log('\n💡 If multiple accounts fail on web platform, there might be:');
  console.log('1. A broader authentication issue');
  console.log('2. Password mismatch (need actual passwords)');
  console.log('3. Database connection issues');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the test
testWebAuthMultiple().catch(console.error);
