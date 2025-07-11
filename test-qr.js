const fetch = require('node-fetch');

async function testQRGeneration() {
  console.log('Testing QR code generation...');
  
  try {
    // 1. Login as teacher
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'teacher@college.edu',
        password: 'teacher123'
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

    // 2. Get subjects to find a subject ID
    const subjectsResponse = await fetch('http://localhost:3000/api/subjects', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Subjects API response:', subjectsResponse.status);
    
    if (!subjectsResponse.ok) {
      console.error('Subjects API failed');
      return;
    }

    const subjectsData = await subjectsResponse.json();
    const subjects = subjectsData.data?.subjects || [];
    console.log('Available subjects:', subjects.length);
    
    if (subjects.length === 0) {
      console.log('No subjects available for QR generation');
      return;
    }

    // 3. Generate a QR code
    const subject = subjects[0];
    console.log('Using subject:', subject.name, subject._id);

    const qrData = {
      subjectId: subject._id,
      classStartTime: new Date().toISOString(),
      classEndTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
      location: {
        address: "Test Classroom",
        latitude: 40.7128,
        longitude: -74.0060,
        radius: 50
      },
      expiryMinutes: 30
    };

    const generateResponse = await fetch('http://localhost:3000/api/qr/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(qrData),
    });

    console.log('QR Generation response:', generateResponse.status);
    
    if (generateResponse.ok) {
      const generateResult = await generateResponse.json();
      console.log('QR Generation result:', {
        success: generateResult.success,
        hasImage: !!generateResult.data?.qrCodeImage,
        imageSize: generateResult.data?.qrCodeImage?.length || 0
      });
    } else {
      const errorData = await generateResponse.json();
      console.error('QR Generation failed:', errorData);
    }

    // 4. Get active QR codes
    const activeResponse = await fetch('http://localhost:3000/api/qr/generate?active=true', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Active QR codes response:', activeResponse.status);
    
    if (activeResponse.ok) {
      const activeData = await activeResponse.json();
      const qrCodes = activeData.qrCodes || [];
      console.log('Active QR codes:', qrCodes.length);
      
      if (qrCodes.length > 0) {
        const firstQR = qrCodes[0];
        console.log('First QR code:', {
          id: firstQR._id,
          hasImage: !!firstQR.qrCodeImage,
          subject: firstQR.subject?.name
        });
      }
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testQRGeneration();
