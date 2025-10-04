/**
 * Browser Debug Script
 * 
 * Run this script in your browser console while logged in to debug the journal entry issue
 * 
 * Instructions:
 * 1. Open your browser developer tools (F12)
 * 2. Go to the Console tab
 * 3. Copy and paste this entire script
 * 4. Press Enter to run it
 */

console.log('🚀 Starting Browser Debug Script...');

// Function to test the journal endpoint with current authentication
async function testJournalEndpoint() {
  console.log('🔍 Testing Journal Endpoint with Current Authentication...');
  
  // Get the current token from localStorage
  const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('accessToken');
  console.log('🔑 Current token:', token ? 'Present' : 'Missing');
  
  if (!token) {
    console.log('❌ No authentication token found in localStorage');
    console.log('💡 Try logging in again');
    return;
  }
  
  // Test the exact request the frontend makes
  const requestData = {
    title: 'Debug Test Entry',
    content: 'This is a debug test entry',
    type: 'daily',
    mood: 'neutral',
    tags: [],
    isPrivate: false,
    mindfulnessDimensions: {
      presence: { rating: 0 },
      emotionAwareness: { rating: 0 },
      intentionality: { rating: 0 },
      attentionQuality: { rating: 0 },
      compassion: { rating: 0 }
    }
  };
  
  console.log('📤 Request data:', requestData);
  
  try {
    const response = await fetch('https://lyfe-production.up.railway.app/api/journal/entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestData)
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseData = await response.json();
    console.log('📥 Response data:', responseData);
    
    if (response.ok) {
      console.log('✅ Journal entry created successfully!');
    } else {
      console.log('❌ Journal entry creation failed');
      console.log('🔍 Error details:', responseData);
      
      if (response.status === 500) {
        console.log('🚨 CONFIRMED: 500 Internal Server Error');
        console.log('💡 This confirms the backend is returning 500 errors');
      } else if (response.status === 401) {
        console.log('🔐 Authentication error - token might be invalid');
      } else if (response.status === 400) {
        console.log('📝 Validation error - check request data');
      }
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Function to test authentication status
async function testAuthStatus() {
  console.log('\n🔐 Testing Authentication Status...');
  
  const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('accessToken');
  
  if (!token) {
    console.log('❌ No token found');
    return;
  }
  
  try {
    const response = await fetch('https://lyfe-production.up.railway.app/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📊 Auth status response:', response.status);
    
    if (response.ok) {
      const userData = await response.json();
      console.log('✅ User authenticated:', userData);
    } else {
      const errorData = await response.json();
      console.log('❌ Auth failed:', errorData);
    }
    
  } catch (error) {
    console.log('❌ Auth test error:', error.message);
  }
}

// Function to check localStorage contents
function checkLocalStorage() {
  console.log('\n💾 Checking LocalStorage Contents...');
  
  const keys = Object.keys(localStorage);
  console.log('📋 LocalStorage keys:', keys);
  
  keys.forEach(key => {
    const value = localStorage.getItem(key);
    console.log(`🔑 ${key}:`, value ? 'Present' : 'Missing');
  });
}

// Function to test health endpoint
async function testHealthEndpoint() {
  console.log('\n🏥 Testing Health Endpoint...');
  
  try {
    const response = await fetch('https://lyfe-production.up.railway.app/api/health');
    const data = await response.json();
    console.log('✅ Health check:', data);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
}

// Function to simulate the exact frontend request
async function simulateFrontendRequest() {
  console.log('\n🎭 Simulating Exact Frontend Request...');
  
  // This simulates the exact request from Journal.jsx:211
  const token = localStorage.getItem('token') || localStorage.getItem('authToken') || localStorage.getItem('accessToken');
  
  if (!token) {
    console.log('❌ Cannot simulate - no token found');
    return;
  }
  
  const newEntry = {
    title: 'Simulated Entry',
    content: 'This is a simulated journal entry',
    type: 'daily',
    mood: 'neutral',
    tags: [],
    isPrivate: false,
    mindfulnessDimensions: {
      presence: { rating: 0 },
      emotionAwareness: { rating: 0 },
      intentionality: { rating: 0 },
      attentionQuality: { rating: 0 },
      compassion: { rating: 0 }
    }
  };
  
  console.log('📤 Simulating request with data:', newEntry);
  
  try {
    const response = await fetch('https://lyfe-production.up.railway.app/api/journal/entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newEntry)
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response ok:', response.ok);
    
    const responseData = await response.json();
    console.log('📥 Response data:', responseData);
    
    if (response.status === 500) {
      console.log('🚨 CONFIRMED: 500 Internal Server Error from backend');
      console.log('💡 The issue is definitely in the backend server');
    }
    
  } catch (error) {
    console.log('❌ Simulation error:', error.message);
  }
}

// Main execution
async function runDebugScript() {
  console.log('🚀 Running Complete Debug Script...\n');
  
  checkLocalStorage();
  await testHealthEndpoint();
  await testAuthStatus();
  await testJournalEndpoint();
  await simulateFrontendRequest();
  
  console.log('\n📋 Debug Summary:');
  console.log('If you see 500 errors above, then:');
  console.log('1. The backend is actually returning 500 errors');
  console.log('2. Our encryption fix is not working');
  console.log('3. There is a different server issue');
  console.log('4. Environment variables are missing');
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Check Railway deployment logs');
  console.log('2. Verify commit 249a70f6 is deployed');
  console.log('3. Check Railway environment variables');
  console.log('4. Look for specific error messages in server logs');
}

// Run the debug script
runDebugScript().catch(console.error);
