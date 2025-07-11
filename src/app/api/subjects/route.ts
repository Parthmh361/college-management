import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Subject } from '@/models/Subject';
import { User } from '@/models/User';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';

async function getSubjectsHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const teacherId = searchParams.get('teacherId');

    // Build query based on user role
    const query: any = { isActive: true };
    
    if (req.user?.role === 'Teacher') {
      // Teachers can only see their subjects
      query.teacher = req.user.userId;
    } else if (req.user?.role === 'Student') {
      // Students can only see subjects they're enrolled in
      query.enrolledStudents = req.user.userId;
    } else if (teacherId && req.user?.role === 'Admin') {
      // Admins can filter by teacher
      query.teacher = teacherId;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Get subjects with pagination
    const skip = (page - 1) * limit;
    const subjects = await Subject.find(query)
      .populate('teacher', 'firstName lastName email')
      .populate('enrolledStudents', 'firstName lastName studentId') // Get basic student info
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalRecords = await Subject.countDocuments(query);
    const totalPages = Math.ceil(totalRecords / limit);

    return NextResponse.json({
      success: true,
      message: 'Subjects retrieved successfully',
      data: {
        subjects,
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
    console.error('Get subjects error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve subjects' },
      { status: 500 }
    );
  }
}

async function createSubjectHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { name, code, description, credits, semester, department, teacherId, academicYear, enrolledStudents = [] } = body;

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: 'Subject name and code are required' },
        { status: 400 }
      );
    }

    // Check if subject code already exists
    const existingSubject = await Subject.findOne({ code: code.toUpperCase(), isActive: true });
    if (existingSubject) {
      return NextResponse.json(
        { success: false, error: 'Subject code already exists' },
        { status: 400 }
      );
    }

    // Validate teacher if provided
    if (teacherId) {
      const teacher = await User.findById(teacherId);
      if (!teacher || teacher.role !== 'Teacher') {
        return NextResponse.json(
          { success: false, error: 'Invalid teacher ID' },
          { status: 400 }
        );
      }
    }

    // Validate enrolled students if provided
    if (enrolledStudents.length > 0) {
      const students = await User.find({
        _id: { $in: enrolledStudents },
        role: 'Student',
        isActive: true
      });
      
      if (students.length !== enrolledStudents.length) {
        return NextResponse.json(
          { success: false, message: 'Some student IDs are invalid' },
          { status: 400 }
        );
      }
    }

    // Create subject
    const subject = new Subject({
      name,
      code: code.toUpperCase(),
      description,
      credits: credits || 3,
      semester: semester || 1,
      department,
      academicYear: academicYear || '2024-2025',
      teacher: teacherId || null,
      enrolledStudents,
      createdBy: req.user?.userId
    });

    await subject.save();

    // Populate for response
    await subject.populate('teacher', 'firstName lastName email');
    await subject.populate('enrolledStudents', 'firstName lastName studentId');

    return NextResponse.json({
      success: true,
      message: 'Subject created successfully',
      data: { subject }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Create subject error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create subject' },
      { status: 500 }
    );
  }
}

async function updateSubjectHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('id');
    
    if (!subjectId) {
      return NextResponse.json(
        { success: false, message: 'Subject ID is required' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, code, description, credits, semester, department, teacherId, academicYear, enrolledStudents } = body;

    // Find subject
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return NextResponse.json(
        { success: false, message: 'Subject not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (req.user?.role === 'Teacher' && subject.teacher.toString() !== req.user.userId) {
      return NextResponse.json(
        { success: false, message: 'You can only update your own subjects' },
        { status: 403 }
      );
    }

    // Update subject
    if (name) subject.name = name;
    if (code) subject.code = code.toUpperCase();
    if (description !== undefined) subject.description = description;
    if (credits) subject.credits = credits;
    if (semester) subject.semester = semester;
    if (department) subject.department = department;
    if (academicYear) subject.academicYear = academicYear;
    if (teacherId !== undefined) subject.teacher = teacherId || null;
    if (enrolledStudents) {
      // Validate students if provided
      const students = await User.find({
        _id: { $in: enrolledStudents },
        role: 'Student',
        isActive: true
      });
      
      if (students.length !== enrolledStudents.length) {
        return NextResponse.json(
          { success: false, message: 'Some student IDs are invalid' },
          { status: 400 }
        );
      }
      
      subject.enrolledStudents = enrolledStudents;
    }

    subject.updatedAt = new Date();
    await subject.save();

    // Populate for response
    await subject.populate('teacher', 'firstName lastName email');
    await subject.populate('enrolledStudents', 'firstName lastName studentId');

    return NextResponse.json({
      success: true,
      message: 'Subject updated successfully',
      data: { subject }
    });

  } catch (error: any) {
    console.error('Update subject error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update subject' },
      { status: 500 }
    );
  }
}

async function deleteSubjectHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get('id');
    
    if (!subjectId) {
      return NextResponse.json(
        { success: false, message: 'Subject ID is required' },
        { status: 400 }
      );
    }

    // Find subject
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return NextResponse.json(
        { success: false, message: 'Subject not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (req.user?.role === 'Teacher' && subject.teacher.toString() !== req.user.userId) {
      return NextResponse.json(
        { success: false, message: 'You can only delete your own subjects' },
        { status: 403 }
      );
    }

    // Soft delete (deactivate)
    subject.isActive = false;
    subject.updatedAt = new Date();
    await subject.save();

    return NextResponse.json({
      success: true,
      message: 'Subject deleted successfully'
    });

  } catch (error: any) {
    console.error('Delete subject error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete subject' },
      { status: 500 }
    );
  }
}

// Export route handlers
export const GET = withAuth(getSubjectsHandler, ['Student', 'Teacher', 'Admin']);
export const POST = withAuth(createSubjectHandler, ['Teacher', 'Admin']);
export const PUT = withAuth(updateSubjectHandler, ['Teacher', 'Admin']);
export const DELETE = withAuth(deleteSubjectHandler, ['Teacher', 'Admin']);
