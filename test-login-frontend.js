// Test script to verify frontend login works with corrected user schema
const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login with firstName/lastName schema...');
    
    const loginData = {
      email: 'admin@college.edu',
      password: 'admin123'
    };

    const response = await axios.post('http://localhost:3000/api/auth/login', loginData);
    
    console.log('Login Response Status:', response.status);
    console.log('Full Response:', JSON.stringify(response.data, null, 2));
    
    // Verify the user object has firstName and lastName
    const user = response.data.data.user;
    if (user.firstName && user.lastName) {
      console.log('✅ SUCCESS: User has firstName and lastName');
      console.log(`Full name: ${user.firstName} ${user.lastName}`);
    } else {
      console.log('❌ ERROR: User missing firstName or lastName');
    }
    
    // Simulate what frontend would store
    const userForStorage = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    };
    
    console.log('\nData that would be stored in localStorage:');
    console.log(JSON.stringify(userForStorage, null, 2));
    
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
  }
}

testLogin();
