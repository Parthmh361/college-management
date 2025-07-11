import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Subject } from '@/models/Subject';
import { User } from '@/models/User';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';

// GET /api/subjects/[id]/students - Get all students enrolled in a subject
async function getStudentsHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectDB();

    const subject = await Subject.findById(id)
      .populate('enrolledStudents', 'firstName lastName email studentId department semester')
      .populate('teacher', 'firstName lastName email');

    if (!subject) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        subject: {
          _id: subject._id,
          name: subject.name,
          code: subject.code,
          teacher: subject.teacher
        },
        students: subject.enrolledStudents
      }
    });

  } catch (error: any) {
    console.error('Error fetching enrolled students:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch enrolled students' },
      { status: 500 }
    );
  }
}

// POST /api/subjects/[id]/students - Add students to a subject
async function addStudentsHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const userRole = req.user?.role;
    if (!userRole || !['Admin', 'Teacher'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Only admins and teachers can assign students' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await req.json();
    const { studentIds } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Student IDs are required' },
        { status: 400 }
      );
    }

    const subject = await Subject.findById(id);
    if (!subject) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      );
    }

    // If teacher, verify they own this subject
    if (userRole === 'Teacher' && subject.teacher?.toString() !== req.user?.userId) {
      return NextResponse.json(
        { success: false, error: 'You can only assign students to your own subjects' },
        { status: 403 }
      );
    }

    // Validate that all provided IDs are valid students
    const students = await User.find({
      _id: { $in: studentIds },
      role: 'Student',
      isActive: true
    });

    if (students.length !== studentIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more student IDs are invalid' },
        { status: 400 }
      );
    }

    // Add students to subject (avoid duplicates)
    const newStudentIds = studentIds.filter(
      (studentId: string) => !subject.enrolledStudents.includes(studentId)
    );

    if (newStudentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'All students are already enrolled in this subject' },
        { status: 400 }
      );
    }

    subject.enrolledStudents.push(...newStudentIds);
    await subject.save();
    await subject.populate('enrolledStudents', 'firstName lastName email studentId department semester');

    return NextResponse.json({
      success: true,
      message: `${newStudentIds.length} student(s) added to subject`,
      data: {
        subject: {
          _id: subject._id,
          name: subject.name,
          code: subject.code
        },
        addedStudents: students.filter(student => 
          newStudentIds.includes(student._id.toString())
        ),
        totalEnrolled: subject.enrolledStudents.length
      }
    });

  } catch (error: any) {
    console.error('Error adding students to subject:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add students to subject' },
      { status: 500 }
    );
  }
}

// DELETE /api/subjects/[id]/students - Remove students from a subject
async function removeStudentsHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const userRole = req.user?.role;
    if (!userRole || !['Admin', 'Teacher'].includes(userRole)) {
      return NextResponse.json(
        { success: false, error: 'Only admins and teachers can remove students' },
        { status: 403 }
      );
    }

    await connectDB();

    const body = await req.json();
    const { studentIds } = body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Student IDs are required' },
        { status: 400 }
      );
    }

    const subject = await Subject.findById(id);
    if (!subject) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      );
    }

    // If teacher, verify they own this subject
    if (userRole === 'Teacher' && subject.teacher?.toString() !== req.user?.userId) {
      return NextResponse.json(
        { success: false, error: 'You can only remove students from your own subjects' },
        { status: 403 }
      );
    }

    // Remove students from subject
    const initialCount = subject.enrolledStudents.length;
    subject.enrolledStudents = subject.enrolledStudents.filter(
      (studentId: any) => !studentIds.includes(studentId.toString())
    );

    const removedCount = initialCount - subject.enrolledStudents.length;

    if (removedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'No students were removed (they may not have been enrolled)' },
        { status: 400 }
      );
    }

    await subject.save();

    return NextResponse.json({
      success: true,
      message: `${removedCount} student(s) removed from subject`,
      data: {
        subject: {
          _id: subject._id,
          name: subject.name,
          code: subject.code
        },
        removedCount,
        totalEnrolled: subject.enrolledStudents.length
      }
    });

  } catch (error: any) {
    console.error('Error removing students from subject:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove students from subject' },
      { status: 500 }
    );
  }
}

// Helper function to wrap handlers with params
function withParams(handler: (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => Promise<NextResponse>) {
  return async function(req: AuthenticatedRequest) {
    const id = req.nextUrl?.pathname.split('/').slice(-2, -1)[0] || '';
    return handler(req, { params: Promise.resolve({ id }) });
  };
}

// Export route handlers
export const GET = withAuth(withParams(getStudentsHandler), ['Student', 'Teacher', 'Admin']);
export const POST = withAuth(withParams(addStudentsHandler), ['Teacher', 'Admin']);
export const DELETE = withAuth(withParams(removeStudentsHandler), ['Teacher', 'Admin']);