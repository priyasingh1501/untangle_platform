#!/usr/bin/env node

// Test Web Authentication with Same Credentials
const fetch = require('node-fetch');

async function testWebAuth() {
  console.log('🧪 Testing Web Authentication');
  console.log('==============================\n');

  const apiUrl = 'https://lyfe-production.up.railway.app/api/auth/login';
  
  // Test with your actual credentials - UPDATE THESE
  const testEmail = 'priya99920@gmail.com'; // Your actual email
  const testPassword = 'Priya@123'; // Your actual password

  console.log('⚠️  UPDATE THE CREDENTIALS IN THIS SCRIPT WITH YOUR REAL ONES!');
  console.log(`📧 Email: ${testEmail}`);
  console.log(`🔑 Password: ${testPassword}`);
  console.log('');

  try {
    console.log('📱 Testing web login...');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });

    const result = await response.json();
    console.log(`📥 Response Status: ${response.status}`);
    console.log(`📥 Response Data: ${JSON.stringify(result, null, 2)}`);
    
    if (response.ok) {
      console.log('✅ Web login successful!');
      console.log('💡 If web login works but WhatsApp doesn\'t, the issue is likely:');
      console.log('   1. Railway hasn\'t deployed the latest WhatsApp auth changes');
      console.log('   2. WhatsApp webhook is not receiving messages properly');
    } else {
      console.log('❌ Web login failed!');
      console.log('💡 If web login fails, the issue is with your credentials:');
      console.log('   1. Email not found in database');
      console.log('   2. Password is incorrect');
      console.log('   3. Account is locked or inactive');
      console.log('   4. 2FA is enabled');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testWebAuth().catch(console.error);
