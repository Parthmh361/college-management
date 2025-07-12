import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET /api/admin/students - Get all students
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const semester = searchParams.get('semester');
    const section = searchParams.get('section');

    const query: any = { role: 'Student' };
    
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);
    if (section) query.section = section;

    const students = await User.find(query)
      .select('-password')
      .sort({ department: 1, semester: 1, section: 1, lastName: 1 });

    return NextResponse.json({
      message: 'Students retrieved successfully',
      students
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/students - Create new student
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { 
      firstName, 
      lastName, 
      email, 
      studentId, 
      department, 
      semester, 
      section, 
      password 
    } = await request.json();

    // Validation
    if (!firstName || !lastName || !email || !studentId || !department || !semester || !section || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Check if email or studentId already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { studentId }]
    });

    if (existingUser) {
      return NextResponse.json({ 
        error: existingUser.email === email ? 'Email already exists' : 'Student ID already exists' 
      }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create student
    const newStudent = new User({
      firstName,
      lastName,
      email,
      studentId,
      department,
      semester,
      section,
      password: hashedPassword,
      role: 'Student',
      isActive: true
    });

    await newStudent.save();

    // Return student without password
    const studentResponse = await User.findById(newStudent._id).select('-password');

    return NextResponse.json({
      message: 'Student created successfully',
      student: studentResponse
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
