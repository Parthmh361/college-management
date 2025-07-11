const fs = require('fs');

async function testAuthFlow() {
  console.log('Testing authentication flow...');
  
  try {
    // 1. Login
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
    console.log('Login response:', loginResponse.status, loginData.success);
    
    if (!loginResponse.ok) {
      console.error('Login failed:', loginData);
      return;
    }

    const token = loginData.data.token;
    console.log('Token received:', token ? 'Yes' : 'No');

    // 2. Test subjects API
    const subjectsResponse = await fetch('http://localhost:3000/api/subjects', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Subjects API response:', subjectsResponse.status);
    
    if (subjectsResponse.ok) {
      const subjectsData = await subjectsResponse.json();
      console.log('Subjects count:', subjectsData.data?.length || 0);
    }

    // 3. Test teachers API
    const teachersResponse = await fetch('http://localhost:3000/api/users?role=Teacher', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Teachers API response:', teachersResponse.status);
    
    if (teachersResponse.ok) {
      const teachersData = await teachersResponse.json();
      console.log('Teachers count:', teachersData.data?.users?.length || 0);
      
      // Check if any teacher has empty ID
      const teachers = teachersData.data?.users || [];
      const emptyIdTeachers = teachers.filter(t => !t._id || t._id.trim() === '');
      if (emptyIdTeachers.length > 0) {
        console.log('WARNING: Found teachers with empty IDs:', emptyIdTeachers.length);
      }
    }

    // 4. Write browser script
    const browserScript = `
// Paste this in browser console after login
localStorage.setItem('token', '${token}');
localStorage.setItem('user', '${JSON.stringify(loginData.data.user)}');
console.log('Token stored in localStorage');
`;

    fs.writeFileSync('browser-auth.js', browserScript);
    console.log('Browser script written to browser-auth.js');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAuthFlow();
