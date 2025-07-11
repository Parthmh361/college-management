import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Attendance } from '@/models/Attendance';
import { Subject } from '@/models/Subject';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';

async function getAttendanceHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId');
    const studentId = searchParams.get('studentId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query based on user role and parameters
    const query: any = {};
    
    if (req.user?.role === 'Student') {
      // Students can only see their own attendance
      query.student = req.user.userId;
    } else if (req.user?.role === 'Teacher') {
      // Teachers can see attendance for their subjects
      query.teacher = req.user.userId;
      if (studentId) {
        query.student = studentId;
      }
    } else if (req.user?.role === 'Admin') {
      // Admins can see all attendance
      if (studentId) {
        query.student = studentId;
      }
    }

    if (subjectId) {
      query.subject = subjectId;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get attendance records with pagination
    const skip = (page - 1) * limit;
    const attendanceRecords = await Attendance.find(query)
      .populate('student', 'firstName lastName studentId')
      .populate('subject', 'name code')
      .populate('teacher', 'firstName lastName')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const totalRecords = await Attendance.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / limit);

    return NextResponse.json({
      success: true,
      message: 'Attendance records retrieved successfully',
      data: {
        attendance: attendanceRecords,
        pagination: {
          currentPage: page,
          totalPages,
          totalRecords,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error: any) {
    console.error('Get attendance error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve attendance records' },
      { status: 500 }
    );
  }
}

async function getAttendanceStatsHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('subjectId');
    const studentId = searchParams.get('studentId') || req.user?.userId;

    if (!subjectId || !studentId) {
      return NextResponse.json(
        { success: false, message: 'Subject ID and Student ID are required' },
        { status: 400 }
      );
    }

    // Check permissions
    if (req.user?.role === 'Student' && studentId !== req.user.userId) {
      return NextResponse.json(
        { success: false, message: 'Students can only view their own attendance' },
        { status: 403 }
      );
    }

    // Get attendance statistics
    const stats = await (Attendance as any).calculateAttendancePercentage(studentId, subjectId === 'all' ? null : subjectId);
    
    // Get recent attendance records
    const attendanceQuery: any = { student: studentId };
    if (subjectId && subjectId !== 'all') {
      attendanceQuery.subject = subjectId;
    }
    
    const recentAttendance = await Attendance.find(attendanceQuery)
      .populate('subject', 'name code')
      .sort({ date: -1 })
      .limit(10);

    return NextResponse.json({
      success: true,
      message: 'Attendance statistics retrieved successfully',
      data: {
        statistics: stats,
        recentAttendance
      }
    });

  } catch (error: any) {
    console.error('Get attendance stats error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve attendance statistics' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getAttendanceHandler, ['Student', 'Teacher', 'Admin']);

// Create a separate route for stats
async function handleStatsRoute(req: AuthenticatedRequest) {
  return getAttendanceStatsHandler(req);
}

export const POST = withAuth(handleStatsRoute, ['Student', 'Teacher', 'Admin']);
