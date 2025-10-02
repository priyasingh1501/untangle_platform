require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const { loginWithCredentials, isUserAuthenticated, getAuthenticatedUser, logoutUser, loadActiveSessions } = require('./server/services/whatsappAuthService');

async function testPersistentAuth() {
  try {
    console.log('🧪 Testing Persistent WhatsApp Authentication');
    console.log('=============================================\n');

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test 1: Login
    console.log('\n📱 Test 1: Login with credentials');
    const loginResult = await loginWithCredentials('919805153470', 'whatsapp-test@example.com', 'testpass123');
    console.log('📤 Login Result:', loginResult.success ? '✅ SUCCESS' : '❌ FAILED');
    console.log('📝 Message:', loginResult.message);

    // Test 2: Check authentication status
    console.log('\n📱 Test 2: Check authentication status');
    const isAuth = isUserAuthenticated('919805153470');
    console.log('📤 Authentication Status:', isAuth ? '✅ AUTHENTICATED' : '❌ NOT AUTHENTICATED');

    if (isAuth) {
      const user = await getAuthenticatedUser('919805153470');
      console.log('👤 Authenticated User:', user.email);
    }

    // Test 3: Simulate server restart by clearing memory cache and reloading
    console.log('\n📱 Test 3: Simulate server restart (clear cache and reload)');
    
    // Clear the in-memory cache (simulating server restart)
    const { phoneToEmailMap } = require('./server/services/whatsappAuthService');
    phoneToEmailMap.clear();
    console.log('🗑️ Cleared in-memory cache');

    // Check authentication after cache clear
    const isAuthAfterClear = isUserAuthenticated('919805153470');
    console.log('📤 Authentication after cache clear:', isAuthAfterClear ? '✅ AUTHENTICATED' : '❌ NOT AUTHENTICATED');

    // Reload sessions from database
    await loadActiveSessions();
    console.log('🔄 Reloaded sessions from database');

    // Check authentication after reload
    const isAuthAfterReload = isUserAuthenticated('919805153470');
    console.log('📤 Authentication after reload:', isAuthAfterReload ? '✅ AUTHENTICATED' : '❌ NOT AUTHENTICATED');

    if (isAuthAfterReload) {
      const userAfterReload = await getAuthenticatedUser('919805153470');
      console.log('👤 User after reload:', userAfterReload.email);
    }

    // Test 4: Logout
    console.log('\n📱 Test 4: Logout');
    const logoutResult = await logoutUser('919805153470');
    console.log('📤 Logout Result:', logoutResult.success ? '✅ SUCCESS' : '❌ FAILED');
    console.log('📝 Message:', logoutResult.message);

    // Test 5: Check authentication after logout
    console.log('\n📱 Test 5: Check authentication after logout');
    const isAuthAfterLogout = isUserAuthenticated('919805153470');
    console.log('📤 Authentication after logout:', isAuthAfterLogout ? '✅ AUTHENTICATED' : '❌ NOT AUTHENTICATED');

    console.log('\n✅ All tests completed!');

    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

testPersistentAuth();
