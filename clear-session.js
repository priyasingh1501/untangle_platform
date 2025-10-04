/**
 * Clear User Session Script
 * This script clears all authentication data and forces a fresh login
 */

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
console.log('🔐 Security update complete! Please log in again for enhanced protection.');

// Optional: Redirect to login page
if (window.location.pathname !== '/login') {
  console.log('🔄 Redirecting to login page...');
  window.location.href = '/login';
}

console.log('✨ Session cleared successfully!');


