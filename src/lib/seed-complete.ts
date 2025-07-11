import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { Subject } from '@/models/Subject';
import { Attendance } from '@/models/Attendance';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  try {
    await connectToDatabase();
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Subject.deleteMany({});
    await Attendance.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Create users
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Admin
    const admin = await User.create({
      firstName: 'System',
      lastName: 'Administrator',
      email: 'admin@college.edu',
      password: hashedPassword,
      role: 'Admin',
      isEmailVerified: true,
      isActive: true,
      profile: {
        department: 'Administration',
        phoneNumber: '+1234567890'
      }
    });
    console.log('✅ Created admin user');

    // Teachers
    const teacher1 = await User.create({
      firstName: 'Dr. Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@college.edu',
      password: hashedPassword,
      role: 'Teacher',
      isEmailVerified: true,
      isActive: true,
      profile: {
        department: 'Computer Science',
        phoneNumber: '+1234567891',
        employeeId: 'T001'
      }
    });

    const teacher2 = await User.create({
      firstName: 'Prof. Michael',
      lastName: 'Brown',
      email: 'michael.brown@college.edu',
      password: hashedPassword,
      role: 'Teacher',
      isEmailVerified: true,
      isActive: true,
      profile: {
        department: 'Mathematics',
        phoneNumber: '+1234567892',
        employeeId: 'T002'
      }
    });

    const teacher3 = await User.create({
      firstName: 'Dr. Emily',
      lastName: 'Davis',
      email: 'emily.davis@college.edu',
      password: hashedPassword,
      role: 'Teacher',
      isEmailVerified: true,
      isActive: true,
      profile: {
        department: 'Physics',
        phoneNumber: '+1234567893',
        employeeId: 'T003'
      }
    });
    console.log('✅ Created teacher users');

    // Students
    const students = [];
    const studentData = [
      { firstName: 'John', lastName: 'Smith', email: 'john.smith@student.college.edu', studentId: 'CS2023001' },
      { firstName: 'Emma', lastName: 'Wilson', email: 'emma.wilson@student.college.edu', studentId: 'CS2023002' },
      { firstName: 'Alex', lastName: 'Taylor', email: 'alex.taylor@student.college.edu', studentId: 'CS2023003' },
      { firstName: 'Sophie', lastName: 'Miller', email: 'sophie.miller@student.college.edu', studentId: 'CS2023004' },
      { firstName: 'Ryan', lastName: 'Anderson', email: 'ryan.anderson@student.college.edu', studentId: 'CS2023005' },
      { firstName: 'Maya', lastName: 'Singh', email: 'maya.singh@student.college.edu', studentId: 'CS2023006' },
      { firstName: 'David', lastName: 'Lee', email: 'david.lee@student.college.edu', studentId: 'CS2023007' },
      { firstName: 'Grace', lastName: 'Clark', email: 'grace.clark@student.college.edu', studentId: 'CS2023008' },
    ];

    for (const studentInfo of studentData) {
      const student = await User.create({
        firstName: studentInfo.firstName,
        lastName: studentInfo.lastName,
        email: studentInfo.email,
        password: hashedPassword,
        role: 'Student',
        isEmailVerified: true,
        isActive: true,
        profile: {
          studentId: studentInfo.studentId,
          department: 'Computer Science',
          semester: 5,
          phoneNumber: `+123456${Math.floor(Math.random() * 10000)}`
        }
      });
      students.push(student);
    }
    console.log('✅ Created student users');

    // Parents
    const parent1 = await User.create({
      firstName: 'Robert',
      lastName: 'Smith',
      email: 'robert.smith@parent.com',
      password: hashedPassword,
      role: 'Parent',
      isEmailVerified: true,
      isActive: true,
      profile: {
        phoneNumber: '+1234567810',
        children: [students[0]._id] // John Smith's parent
      }
    });

    const parent2 = await User.create({
      firstName: 'Lisa',
      lastName: 'Wilson',
      email: 'lisa.wilson@parent.com',
      password: hashedPassword,
      role: 'Parent',
      isEmailVerified: true,
      isActive: true,
      profile: {
        phoneNumber: '+1234567811',
        children: [students[1]._id] // Emma Wilson's parent
      }
    });
    console.log('✅ Created parent users');

    // Alumni
    const alumni1 = await User.create({
      firstName: 'James',
      lastName: 'Rodriguez',
      email: 'james.rodriguez@alumni.college.edu',
      password: hashedPassword,
      role: 'Alumni',
      isEmailVerified: true,
      isActive: true,
      profile: {
        department: 'Computer Science',
        graduationYear: 2020,
        currentCompany: 'Google',
        phoneNumber: '+1234567812'
      }
    });
    console.log('✅ Created alumni users');

    // Create subjects
    const subject1 = await Subject.create({
      name: 'Data Structures and Algorithms',
      code: 'CS301',
      description: 'Introduction to fundamental data structures and algorithms',
      credits: 4,
      department: 'Computer Science',
      semester: 5,
      year: 2024,
      academicYear: '2024-2025',
      teacher: teacher1._id,
      enrolledStudents: students.slice(0, 6).map(s => s._id),
      isActive: true,
      schedule: [{
        day: 'Monday',
        startTime: '09:00',
        endTime: '10:30',
        room: 'CS-101'
      }, {
        day: 'Wednesday',
        startTime: '09:00',
        endTime: '10:30',
        room: 'CS-101'
      }],
      createdBy: admin._id
    });

    const subject2 = await Subject.create({
      name: 'Database Management Systems',
      code: 'CS302',
      description: 'Comprehensive study of database design and management',
      credits: 3,
      department: 'Computer Science',
      semester: 5,
      year: 2024,
      academicYear: '2024-2025',
      teacher: teacher1._id,
      enrolledStudents: students.slice(0, 5).map(s => s._id),
      isActive: true,
      schedule: [{
        day: 'Tuesday',
        startTime: '11:00',
        endTime: '12:30',
        room: 'CS-102'
      }, {
        day: 'Thursday',
        startTime: '11:00',
        endTime: '12:30',
        room: 'CS-102'
      }],
      createdBy: admin._id
    });

    const subject3 = await Subject.create({
      name: 'Linear Algebra',
      code: 'MATH201',
      description: 'Mathematical foundations for computer science',
      credits: 3,
      department: 'Mathematics',
      semester: 5,
      year: 2024,
      academicYear: '2024-2025',
      teacher: teacher2._id,
      enrolledStudents: students.slice(2, 8).map(s => s._id),
      isActive: true,
      schedule: [{
        day: 'Monday',
        startTime: '14:00',
        endTime: '15:30',
        room: 'MATH-201'
      }, {
        day: 'Friday',
        startTime: '14:00',
        endTime: '15:30',
        room: 'MATH-201'
      }],
      createdBy: admin._id
    });

    const subject4 = await Subject.create({
      name: 'Physics for Engineers',
      code: 'PHY101',
      description: 'Fundamental physics concepts for engineering students',
      credits: 4,
      department: 'Physics',
      semester: 5,
      year: 2024,
      academicYear: '2024-2025',
      teacher: teacher3._id,
      enrolledStudents: students.slice(1, 7).map(s => s._id),
      isActive: true,
      schedule: [{
        day: 'Tuesday',
        startTime: '09:00',
        endTime: '10:30',
        room: 'PHY-LAB1'
      }, {
        day: 'Thursday',
        startTime: '09:00',
        endTime: '10:30',
        room: 'PHY-LAB1'
      }],
      createdBy: admin._id
    });

    const subject5 = await Subject.create({
      name: 'Software Engineering',
      code: 'CS401',
      description: 'Principles and practices of software development',
      credits: 3,
      department: 'Computer Science',
      semester: 5,
      year: 2024,
      academicYear: '2024-2025',
      teacher: teacher1._id,
      enrolledStudents: students.slice(0, 4).map(s => s._id),
      isActive: true,
      schedule: [{
        day: 'Wednesday',
        startTime: '15:30',
        endTime: '17:00',
        room: 'CS-103'
      }],
      createdBy: admin._id
    });
    console.log('✅ Created subjects');

    // Create sample attendance records
    const subjects = [subject1, subject2, subject3, subject4, subject5];
    const statuses = ['Present', 'Late', 'Absent'];
    
    // Generate attendance for the last 30 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    for (let i = 0; i < 30; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      // Skip weekends
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue;
      
      for (const subject of subjects) {
        // Random chance of having class on this day (80%)
        if (Math.random() < 0.8) {
          for (const studentId of subject.enrolledStudents) {
            // 85% chance student is present, 10% late, 5% absent
            const rand = Math.random();
            const status = rand < 0.85 ? 'Present' : rand < 0.95 ? 'Late' : 'Absent';
            
            await Attendance.create({
              student: studentId,
              subject: subject._id,
              teacher: subject.teacher,
              date: currentDate,
              status,
              markedAt: status !== 'Absent' ? new Date(currentDate.getTime() + Math.random() * 3600000) : undefined, // Random time within an hour
              classStartTime: new Date(currentDate.getTime() + 9 * 3600000), // 9 AM
              classEndTime: new Date(currentDate.getTime() + 10 * 3600000), // 10 AM
            });
          }
        }
      }
    }
    console.log('✅ Created sample attendance records');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Created accounts:');
    console.log('👑 Admin: admin@college.edu / admin123');
    console.log('👨‍🏫 Teachers:');
    console.log('   • sarah.johnson@college.edu / admin123');
    console.log('   • michael.brown@college.edu / admin123');
    console.log('   • emily.davis@college.edu / admin123');
    console.log('👨‍🎓 Students:');
    studentData.forEach(student => {
      console.log(`   • ${student.email} / admin123`);
    });
    console.log('👨‍👩‍👧‍👦 Parents:');
    console.log('   • robert.smith@parent.com / admin123');
    console.log('   • lisa.wilson@parent.com / admin123');
    console.log('👨‍💼 Alumni:');
    console.log('   • james.rodriguez@alumni.college.edu / admin123');
    console.log('\n📚 Created subjects:');
    console.log('   • CS301 - Data Structures and Algorithms');
    console.log('   • CS302 - Database Management Systems');
    console.log('   • MATH201 - Linear Algebra');
    console.log('   • PHY101 - Physics for Engineers');
    console.log('   • CS401 - Software Engineering');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    process.exit(0);
  }
}

// Run the seeding
seedDatabase();
