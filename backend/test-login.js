const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login...');
    
    // Test the API endpoint
    const response = await axios.post('http://localhost:5002/api/auth/login', {
      email: 'demo@lyfe.app',
      password: 'demo123456'
    });
    
    console.log('✅ Login successful!');
    console.log('Token:', response.data.token);
    console.log('User:', response.data.user.email);
    
    // Test the profile endpoint with the token
    const profileResponse = await axios.get('http://localhost:5002/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${response.data.token}`
      }
    });
    
    console.log('✅ Profile fetch successful!');
    console.log('Profile:', profileResponse.data.user.email);
    
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
  }
}

testLogin();
