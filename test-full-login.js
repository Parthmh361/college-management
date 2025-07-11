// Full login flow test
const testFullLogin = async () => {
  try {
    console.log('🔄 Testing full login flow...');
    
    // Test login API
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@college.edu',
        password: 'admin123'
      }),
    });

    const loginData = await loginResponse.json();
    
    if (loginResponse.ok) {
      console.log('✅ Login API working');
      console.log('📝 Response structure:', {
        success: loginData.success,
        hasData: !!loginData.data,
        hasUser: !!loginData.data?.user,
        hasToken: !!loginData.data?.token,
        userName: loginData.data?.user ? `${loginData.data.user.firstName} ${loginData.data.user.lastName}` : 'N/A',
        userRole: loginData.data?.user?.role || 'N/A'
      });
      
      // Test token verification
      const token = loginData.data.token;
      const verifyResponse = await fetch('http://localhost:3000/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (verifyResponse.ok) {
        console.log('✅ Token verification working');
        const verifyData = await verifyResponse.json();
        console.log('📝 Verified user:', verifyData.user?.firstName, verifyData.user?.lastName);
      } else {
        console.log('❌ Token verification failed');
      }
      
    } else {
      console.log('❌ Login failed:', loginData.message || loginData.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

testFullLogin().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}).catch(err => {
  console.error('💥 Test crashed:', err);
  process.exit(1);
});
