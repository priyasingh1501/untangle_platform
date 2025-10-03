/**
 * IMMEDIATE FIX: Clear User Session
 * 
 * If you're experiencing logout issues when switching tabs, run this in your browser console:
 */

// Copy and paste this into your browser's developer console (F12)
(function() {
  console.log('🧹 Clearing user session data...');
  
  // Clear all authentication-related localStorage items
  const authKeys = [
    'token',
    'refreshToken', 
    'user',
    'authToken',
    'accessToken',
    'jwt',
    'session'
  ];
  
  authKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`✅ Cleared ${key}`);
    }
  });
  
  // Clear all sessionStorage as well
  sessionStorage.clear();
  console.log('✅ Cleared sessionStorage');
  
  // Show user-friendly message
  console.log('🔐 Security update complete! Please refresh the page and log in again.');
  
  // Refresh the page to apply changes
  console.log('🔄 Refreshing page...');
  window.location.reload();
})();

console.log('📋 INSTRUCTIONS:');
console.log('1. Open browser developer tools (F12)');
console.log('2. Go to Console tab');
console.log('3. Copy and paste the code above');
console.log('4. Press Enter to run it');
console.log('5. The page will refresh and you can log in again');

