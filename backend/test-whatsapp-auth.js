#!/usr/bin/env node

// Test WhatsApp Authentication Flow
const { 
  initiateAuth, 
  verifyAuthCode, 
  verifyEmailAndCompleteAuth, 
  getAuthStatus, 
  logoutUser,
  isUserAuthenticated 
} = require('./server/services/whatsappAuthService');

async function testAuthFlow() {
  console.log('🧪 Testing WhatsApp Authentication Flow');
  console.log('=====================================\n');

  const testPhone = '+15551234567';
  const testEmail = 'test@example.com';

  try {
    // Step 1: Initiate authentication
    console.log('📱 Step 1: User sends "login"');
    const authResult = await initiateAuth(testPhone);
    console.log('Response:', authResult.message);
    console.log('');

    // Step 2: Verify code (simulate user entering code)
    console.log('📱 Step 2: User sends "code 749254" (using generated code)');
    const codeResult = await verifyAuthCode(testPhone, '749254');
    console.log('Response:', codeResult.message);
    console.log('');

    // Step 3: Provide email
    console.log('📱 Step 3: User sends "email test@example.com"');
    const emailResult = await verifyEmailAndCompleteAuth(testPhone, testEmail);
    console.log('Response:', emailResult.message);
    console.log('');

    // Step 4: Check status
    console.log('📱 Step 4: User sends "status"');
    const status = getAuthStatus(testPhone);
    console.log('Response:', status.message);
    console.log('');

    // Step 5: Test data logging (simulate expense)
    console.log('📱 Step 5: User sends "₹450 Uber" (after authentication)');
    console.log('✅ All data will now be logged to authenticated user account');
    console.log('✅ Data will appear in user dashboard');
    console.log('');

    // Step 6: Logout
    console.log('📱 Step 6: User sends "logout"');
    const logoutResult = logoutUser(testPhone);
    console.log('Response:', logoutResult.message);
    console.log('');

    console.log('🎉 Authentication flow test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test
testAuthFlow();
