const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

async function testRegistration() {
  console.log('Testing Registration Endpoint...\n');
  console.log(`API URL: ${API_URL}\n`);

  // Test data
  const testData = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`, // Unique email
    password: 'password123',
    referralCode: undefined // No referral code
  };

  try {
    console.log('Sending registration request...');
    console.log('Data:', { ...testData, password: '***' });
    
    const response = await axios.post(`${API_URL}/auth/register`, testData);
    
    console.log('\n✅ SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('\n❌ FAILED!');
    
    if (error.response) {
      // Server responded with error
      console.log('Status:', error.response.status);
      console.log('Error Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      // Request made but no response
      console.log('No response received from server.');
      console.log('Is the backend server running?');
      console.log('Check:', API_URL);
    } else {
      // Error setting up request
      console.log('Error:', error.message);
    }
  }
}

// Test health endpoint first
async function testHealth() {
  try {
    console.log('Testing health endpoint...');
    const response = await axios.get(`${API_URL}/health`);
    console.log('✅ Backend is running');
    console.log('Response:', response.data);
    console.log('\n');
    return true;
  } catch (error) {
    console.log('❌ Backend is not accessible');
    console.log('Error:', error.message);
    console.log('\n');
    return false;
  }
}

async function runTests() {
  const isHealthy = await testHealth();
  
  if (!isHealthy) {
    console.log('Please start the backend server first:');
    console.log('  cd backend');
    console.log('  npm run dev');
    process.exit(1);
  }
  
  await testRegistration();
}

runTests();

