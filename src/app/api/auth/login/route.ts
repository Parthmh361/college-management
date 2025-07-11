import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { generateToken, createAuthResponse } from '@/lib/auth';
import { LoginCredentials } from '@/types';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body: LoginCredentials = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    console.log('Login attempt:', { email, passwordLength: password.length });

    // Find user by credentials (this method handles password verification and account locking)
    const user = await (User as any).findByCredentials(email, password);
    
    // Debug: Log user data to see what we're getting
    console.log('Found user:', {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      keys: Object.keys(user.toObject ? user.toObject() : user)
    });

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });

    // Create response with user data and token
    const response = createAuthResponse(user, token);

    // Set HTTP-only cookie for additional security (optional)
    const res = NextResponse.json(response);
    res.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return res;

  } catch (error: any) {
    console.error('Login error:', error);
    
    // Return specific error messages for authentication failures
    if (error.message.includes('Invalid login credentials') || 
        error.message.includes('Account temporarily locked')) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
