// Test Profile API Endpoints
// Run this with: node test-profile-api.js

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test data
const testUser = {
  email: 'test@example.com',
  password: 'testpassword'
};

async function testProfileAPI() {
  console.log('🧪 Testing Profile API Endpoints...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data);
    console.log('');

    // Test 2: Test profile endpoint without authentication (should fail)
    console.log('2. Testing profile endpoint without authentication...');
    try {
      await axios.get(`${BASE_URL}/api/profile`);
      console.log('❌ Profile endpoint should require authentication');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Profile endpoint correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }
    console.log('');

    // Test 3: Test with invalid token (should fail)
    console.log('3. Testing profile endpoint with invalid token...');
    try {
      await axios.get(`${BASE_URL}/api/profile`, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      console.log('❌ Profile endpoint should reject invalid token');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Profile endpoint correctly rejects invalid token');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }
    console.log('');

    // Test 4: Test profile endpoint with valid token (if you have one)
    console.log('4. Testing profile endpoint with valid token...');
    console.log('ℹ️  To test with a valid token, you need to:');
    console.log('   - Log in through the frontend');
    console.log('   - Copy the token from localStorage');
    console.log('   - Replace "YOUR_TOKEN_HERE" with the actual token');
    console.log('');

    // Uncomment and replace with actual token to test:
    /*
    const validToken = 'YOUR_TOKEN_HERE';
    try {
      const profileResponse = await axios.get(`${BASE_URL}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${validToken}`
        }
      });
      console.log('✅ Profile endpoint works with valid token');
      console.log('Profile data:', profileResponse.data);
    } catch (error) {
      console.log('❌ Profile endpoint failed with valid token:', error.response?.data || error.message);
    }
    */

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the server is running on port 5000');
    }
  }
}

// Run the tests
testProfileAPI();
