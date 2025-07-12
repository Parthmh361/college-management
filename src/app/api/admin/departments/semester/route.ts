import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { verifyToken } from '@/lib/auth';

// POST /api/admin/departments/semester - Add semester to department
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

    const { department, semester, sections } = await request.json();

    if (!department || !semester) {
      return NextResponse.json({ error: 'Department and semester are required' }, { status: 400 });
    }

    // Check if semester already exists in department
    const existingSemester = await User.findOne({ 
      department: department, 
      semester: semester 
    });

    if (existingSemester) {
      return NextResponse.json({ error: 'Semester already exists in this department' }, { status: 409 });
    }

    return NextResponse.json({
      message: 'Semester structure noted. Add students to activate semester.',
      semester: { department, semester, sections: sections || ['A', 'B', 'C'] }
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding semester:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
