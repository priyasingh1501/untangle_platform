const axios = require('axios');

/**
 * Simple script to test the seed endpoint
 * Run with: node scripts/runSeed.js
 */

async function runSeed() {
  try {
    console.log('🌱 Testing seed endpoint...');
    
    // You'll need to replace this with a valid token from your app
    const token = 'YOUR_JWT_TOKEN_HERE';
    
    if (token === 'YOUR_JWT_TOKEN_HERE') {
      console.log('❌ Please replace YOUR_JWT_TOKEN_HERE with a valid token from your app');
      console.log('To get a token:');
      console.log('1. Login to your app');
      console.log('2. Open browser dev tools -> Console');
      console.log('3. Run: localStorage.getItem("token")');
      console.log('4. Copy the token and replace it above');
      return;
    }
    
    const response = await axios.post('http://localhost:5002/api/dev/seed', {}, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Seed successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ Seed failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

runSeed();
