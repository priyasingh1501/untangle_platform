// Test client-side API connection
const axios = require('axios');

async function testClientAPI() {
  try {
    console.log('Testing client API connection...');
    
    // Test the API endpoint that the client would use
    const response = await axios.post('http://localhost:5002/api/auth/login', {
      email: 'demo@lyfe.app',
      password: 'demo123456'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      }
    });
    
    console.log('✅ Client API connection successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Client API connection failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testClientAPI();
