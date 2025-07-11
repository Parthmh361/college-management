// Test script to verify login functionality
const testLogin = async () => {
  try {
    console.log('Making request...');
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@college.edu',
        password: 'admin123'
      }),
    });

    console.log('Got response, parsing...');
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('Token:', data.token ? 'Present' : 'Missing');
      console.log('User:', data.user ? 'Present' : 'Missing');
    } else {
      console.log('❌ Login failed:', data.error || data.message || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
};

console.log('Testing login with admin@college.edu / admin123...');
testLogin().then(() => {
  console.log('Test completed');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
