import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { verifyToken } from '@/lib/auth';

// POST /api/admin/departments/section - Add section to department/semester
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

    const { department, semester, sectionName } = await request.json();

    if (!department || !semester || !sectionName) {
      return NextResponse.json({ error: 'Department, semester, and section name are required' }, { status: 400 });
    }

    // Check if section already exists
    const existingSection = await User.findOne({ 
      department: department, 
      semester: semester,
      section: sectionName 
    });

    if (existingSection) {
      return NextResponse.json({ error: 'Section already exists' }, { status: 409 });
    }

    return NextResponse.json({
      message: 'Section structure noted. Add students to activate section.',
      section: { department, semester, sectionName }
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding section:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
