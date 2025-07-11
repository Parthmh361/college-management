import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { generateToken, createAuthResponse } from '@/lib/auth';
import { RegisterData } from '@/types';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body: RegisterData = await request.json();
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      studentId,
      employeeId,
      department,
      course,
      semester,
      year
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json(
        { success: false, message: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Check for duplicate studentId or employeeId
    if (studentId) {
      const existingStudent = await User.findOne({ studentId });
      if (existingStudent) {
        return NextResponse.json(
          { success: false, message: 'Student ID already exists' },
          { status: 409 }
        );
      }
    }

    if (employeeId) {
      const existingEmployee = await User.findOne({ employeeId });
      if (existingEmployee) {
        return NextResponse.json(
          { success: false, message: 'Employee ID already exists' },
          { status: 409 }
        );
      }
    }

    // Create user data object
    const userData: any = {
      firstName,
      lastName,
      email,
      password,
      role,
      department,
      isVerified: false // Email verification can be implemented later
    };

    // Add role-specific fields
    if (role === 'Student') {
      userData.studentId = studentId;
      userData.course = course;
      userData.semester = semester;
      userData.year = year;
    } else if (role === 'Teacher' || role === 'Admin') {
      userData.employeeId = employeeId;
    }

    // Create new user
    const user = new User(userData);
    await user.save();

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });

    // Create response
    const response = createAuthResponse(user, token);

    // Set HTTP-only cookie
    const res = NextResponse.json({
      ...response,
      message: 'User registered successfully'
    }, { status: 201 });

    res.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return res;

  } catch (error: any) {
    console.error('Registration error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, message: messages.join(', ') },
        { status: 400 }
      );
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json(
        { success: false, message: `${field} already exists` },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
