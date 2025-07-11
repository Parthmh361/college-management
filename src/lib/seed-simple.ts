// Set environment variables first
process.env.MONGODB_URI = 'mongodb+srv://parthchoudhari3612:qsefthikp@cluster0.ccucqrl.mongodb.net/college_management?retryWrites=true&w=majority&appName=Cluster0';
process.env.JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production-2024';

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// MongoDB Schema Definitions (simplified for seeding)
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: true },
  isOnline: { type: Boolean, default: false },
  profile: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: String,
  credits: Number,
  semester: String,
  department: String,
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  schedule: [{}]
});

// Models
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Subject = mongoose.models.Subject || mongoose.model('Subject', subjectSchema);

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    // Clear existing users to avoid schema conflicts
    await User.deleteMany({});
    console.log('Cleared existing users');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await User.findOneAndUpdate(
      { email: 'admin@college.edu' },
      {
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@college.edu',
        password: adminPassword,
        role: 'Admin',
        isActive: true,
        isEmailVerified: true,
        isOnline: false,
        profile: {
          employeeId: 'EMP001',
          department: 'Administration',
          joiningDate: new Date('2020-01-01')
        }
      },
      { upsert: true, new: true }
    );

    // Create teacher user
    const teacherPassword = await bcrypt.hash('teacher123', 12);
    const teacher = await User.findOneAndUpdate(
      { email: 'teacher@college.edu' },
      {
        firstName: 'John',
        lastName: 'Teacher',
        email: 'teacher@college.edu',
        password: teacherPassword,
        role: 'Teacher',
        isActive: true,
        isEmailVerified: true,
        isOnline: false,
        profile: {
          employeeId: 'EMP002',
          department: 'Computer Science',
          joiningDate: new Date('2021-08-01'),
          subjects: []
        }
      },
      { upsert: true, new: true }
    );

    // Create student user
    const studentPassword = await bcrypt.hash('student123', 12);
    const student = await User.findOneAndUpdate(
      { email: 'student@college.edu' },
      {
        firstName: 'Jane',
        lastName: 'Student',
        email: 'student@college.edu',
        password: studentPassword,
        role: 'Student',
        isActive: true,
        isEmailVerified: true,
        isOnline: false,
        profile: {
          studentId: 'STU001',
          batch: '2024',
          semester: 'First',
          course: 'Bachelor of Computer Science',
          guardianContact: {
            name: 'John Doe',
            phone: '+1234567890',
            email: 'parent@college.edu',
            relation: 'Father'
          }
        }
      },
      { upsert: true, new: true }
    );

    // Create parent user
    const parentPassword = await bcrypt.hash('parent123', 12);
    const parent = await User.findOneAndUpdate(
      { email: 'parent@college.edu' },
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'parent@college.edu',
        password: parentPassword,
        role: 'Parent',
        isActive: true,
        isEmailVerified: true,
        isOnline: false,
        profile: {
          children: [student._id],
          occupation: 'Engineer',
          address: '123 Main Street, City, State',
          phone: '+1234567890'
        }
      },
      { upsert: true, new: true }
    );

    // Create alumni user
    const alumniPassword = await bcrypt.hash('alumni123', 12);
    const alumni = await User.findOneAndUpdate(
      { email: 'alumni@college.edu' },
      {
        firstName: 'Alex',
        lastName: 'Alumni',
        email: 'alumni@college.edu',
        password: alumniPassword,
        role: 'Alumni',
        isActive: true,
        isEmailVerified: true,
        isOnline: false,
        profile: {
          studentId: 'STU999',
          graduationYear: '2020',
          course: 'Bachelor of Computer Science',
          currentCompany: 'Tech Corp',
          currentPosition: 'Software Engineer',
          linkedin: 'https://linkedin.com/in/alexalumni'
        }
      },
      { upsert: true, new: true }
    );

    // Create subjects
    const mathSubject = await Subject.findOneAndUpdate(
      { code: 'MATH101' },
      {
        name: 'Mathematics I',
        code: 'MATH101',
        description: 'Basic mathematics for computer science students',
        credits: 3,
        semester: 'First',
        department: 'Mathematics',
        teacher: teacher._id,
        isActive: true,
        schedule: [
          {
            day: 'Monday',
            startTime: '09:00',
            endTime: '10:30',
            room: 'Room 101'
          },
          {
            day: 'Wednesday',
            startTime: '09:00',
            endTime: '10:30',
            room: 'Room 101'
          },
          {
            day: 'Friday',
            startTime: '09:00',
            endTime: '10:30',
            room: 'Room 101'
          }
        ]
      },
      { upsert: true, new: true }
    );

    const csSubject = await Subject.findOneAndUpdate(
      { code: 'CS101' },
      {
        name: 'Introduction to Computer Science',
        code: 'CS101',
        description: 'Fundamentals of computer science and programming',
        credits: 4,
        semester: 'First',
        department: 'Computer Science',
        teacher: teacher._id,
        isActive: true,
        schedule: [
          {
            day: 'Tuesday',
            startTime: '10:30',
            endTime: '12:00',
            room: 'Lab 201'
          },
          {
            day: 'Thursday',
            startTime: '10:30',
            endTime: '12:00',
            room: 'Lab 201'
          }
        ]
      },
      { upsert: true, new: true }
    );

    const physicsSubject = await Subject.findOneAndUpdate(
      { code: 'PHY101' },
      {
        name: 'Physics I',
        code: 'PHY101',
        description: 'Basic physics concepts for engineering students',
        credits: 3,
        semester: 'First',
        department: 'Physics',
        teacher: teacher._id,
        isActive: true,
        schedule: [
          {
            day: 'Monday',
            startTime: '14:00',
            endTime: '15:30',
            room: 'Room 102'
          },
          {
            day: 'Wednesday',
            startTime: '14:00',
            endTime: '15:30',
            room: 'Room 102'
          }
        ]
      },
      { upsert: true, new: true }
    );

    // Update teacher's subjects
    await User.findByIdAndUpdate(teacher._id, {
      $set: {
        'profile.subjects': [mathSubject._id, csSubject._id, physicsSubject._id]
      }
    });

    console.log('Database seeded successfully!');
    console.log('Created users:');
    console.log('- Admin: admin@college.edu / admin123');
    console.log('- Teacher: teacher@college.edu / teacher123');
    console.log('- Student: student@college.edu / student123');
    console.log('- Parent: parent@college.edu / parent123');
    console.log('- Alumni: alumni@college.edu / alumni123');
    console.log('\nCreated subjects:');
    console.log('- MATH101: Mathematics I');
    console.log('- CS101: Introduction to Computer Science');
    console.log('- PHY101: Physics I');

    await mongoose.connection.close();

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase().then(() => {
  console.log('Seeding completed');
  process.exit(0);
}).catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
