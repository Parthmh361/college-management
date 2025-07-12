import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Timetable } from '@/models/Timetable';
import { User } from '@/models/User';
import { Subject } from '@/models/Subject';
import { verifyToken } from '@/lib/auth';

// GET /api/timetable - Get timetables
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

    const user = await User.findById(decoded.userId).select('role department semester');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const semester = searchParams.get('semester');
    const department = searchParams.get('department');
    const academicYear = searchParams.get('academicYear') || '2024-25';

    const query: any = { academicYear, isActive: true };

    // If user is not admin, filter by their department/semester
    if (user.role !== 'Admin') {
      if (user.role === 'Student') {
        query.semester = user.semester;
        query.department = user.department;
      } else if (user.role === 'Teacher') {
        query.department = user.department;
      }
    } else {
      // Admin can filter by specific semester/department
      if (semester) query.semester = parseInt(semester);
      if (department) query.department = department;
    }

    const timetables = await Timetable.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ department: 1, semester: 1 });

    // Manually populate nested references
    for (const timetable of timetables) {
      for (const section of timetable.sections) {
        for (const day of section.schedule) {
          for (const timeSlot of day.timeSlots) {
            await timeSlot.populate('subject', 'name code');
            await timeSlot.populate('teacher', 'firstName lastName email');
          }
        }
      }
    }

    return NextResponse.json({
      message: 'Timetables retrieved successfully',
      timetables
    });

  } catch (error) {
    console.error('Error fetching timetables:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/timetable - Create new timetable (Admin only)
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

    const user = await User.findById(decoded.userId).select('role');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'Admin') {
      return NextResponse.json({ error: 'Access denied. Admin only.' }, { status: 403 });
    }

    const timetableData = await request.json();
    
    // Validate required fields - now expecting sections instead of schedule
    const { semester, department, academicYear, sections } = timetableData;
    if (!semester || !department || !academicYear || !sections) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if timetable already exists
    const existingTimetable = await Timetable.findOne({
      semester,
      department,
      academicYear,
      isActive: true
    });

    if (existingTimetable) {
      return NextResponse.json(
        { 
          error: 'Timetable already exists for this semester/department/year',
          message: 'A timetable already exists for this combination. Please edit the existing timetable or create one for a different semester/department.',
          existingTimetableId: existingTimetable._id
        },
        { status: 409 }
      );
    }

    const timetable = new Timetable({
      ...timetableData,
      createdBy: decoded.userId
    });

    await timetable.save();

    const populatedTimetable = await Timetable.findById(timetable._id)
      .populate('createdBy', 'firstName lastName');

    // Manually populate nested references
    for (const section of populatedTimetable.sections) {
      for (const day of section.schedule) {
        for (const timeSlot of day.timeSlots) {
          await timeSlot.populate('subject', 'name code');
          await timeSlot.populate('teacher', 'firstName lastName email');
        }
      }
    }

    return NextResponse.json({
      message: 'Timetable created successfully',
      timetable: populatedTimetable
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating timetable:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
