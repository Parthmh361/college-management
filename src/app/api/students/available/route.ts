import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { Subject } from '@/models/Subject';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';

// GET /api/students/available - Get students available for assignment to subjects
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    // Check if user is admin or teacher
    const userRole = request.user?.role;
    if (!userRole || !['Admin', 'Teacher'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Only admins and teachers can view students' },
        { status: 403 }
      );
    }

    await connectDB();

    const url = new URL(request.url);
    const subjectId = url.searchParams.get('subjectId');
    const department = url.searchParams.get('department');
    const semester = url.searchParams.get('semester');
    const search = url.searchParams.get('search');

    // Build query for students
    const studentQuery: any = {
      role: 'Student',
      isActive: true
    };

    // Filter by department if provided
    if (department && department !== 'all') {
      studentQuery.department = department;
    }

    // Filter by semester if provided
    if (semester && semester !== 'all') {
      studentQuery.semester = parseInt(semester);
    }

    // Search by name, email, or student ID
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      studentQuery.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { studentId: searchRegex }
      ];
    }

    // Get all students matching criteria
    let students = await User.find(studentQuery)
      .select('firstName lastName email studentId department semester')
      .sort({ firstName: 1, lastName: 1 });

    // If subjectId is provided, filter out already enrolled students
    if (subjectId) {
      const subject = await Subject.findById(subjectId).select('enrolledStudents');
      if (subject) {
        const enrolledIds = subject.enrolledStudents.map((id: any) => id.toString());
        students = students.filter(student => !enrolledIds.includes(student._id.toString()));
      }
    }

    // Get department and semester options for filters
    const departments = await User.distinct('department', { role: 'Student', isActive: true });
    const semesters = await User.distinct('semester', { role: 'Student', isActive: true });

    return NextResponse.json({
      success: true,
      data: {
        students,
        filters: {
          departments: departments.filter(Boolean).sort(),
          semesters: semesters.filter(Boolean).sort((a, b) => a - b)
        },
        total: students.length
      }
    });

  } catch (error: any) {
    console.error('Error fetching available students:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch available students' },
      { status: 500 }
    );
  }
});
