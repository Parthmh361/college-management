import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Subject } from '@/models/Subject';
import { User } from '@/models/User';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';

async function getSubjectHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    
    const { id } = await params;
    
    const subject = await Subject.findById(id)
      .populate('teacher', 'firstName lastName email')
      .populate('enrolledStudents', 'firstName lastName studentId');

    if (!subject) {
      return NextResponse.json(
        { success: false, message: 'Subject not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { subject }
    });

  } catch (error: any) {
    console.error('Get subject error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve subject' },
      { status: 500 }
    );
  }
}

async function updateSubjectHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    
    const { id } = await params;
    
    const body = await req.json();
    const { name, code, description, credits, semester, department, teacherId } = body;

    // Find subject
    const subject = await Subject.findById(id);
    if (!subject) {
      return NextResponse.json(
        { success: false, message: 'Subject not found' },
        { status: 404 }
      );
    }

    // Check permissions - only admins can update subjects
    if (req.user?.role !== 'Admin') {
      return NextResponse.json(
        { success: false, message: 'Only admins can update subjects' },
        { status: 403 }
      );
    }

    // Check if subject code already exists (exclude current subject)
    if (code && code !== subject.code) {
      const existingSubject = await Subject.findOne({ 
        code: code.toUpperCase(), 
        isActive: true,
        _id: { $ne: id }
      });
      if (existingSubject) {
        return NextResponse.json(
          { success: false, message: 'Subject code already exists' },
          { status: 400 }
        );
      }
    }

    // Validate teacher if provided
    if (teacherId) {
      const teacher = await User.findById(teacherId);
      if (!teacher || teacher.role !== 'Teacher') {
        return NextResponse.json(
          { success: false, message: 'Invalid teacher ID' },
          { status: 400 }
        );
      }
    }

    // Update subject fields
    if (name) subject.name = name;
    if (code) subject.code = code.toUpperCase();
    if (description !== undefined) subject.description = description;
    if (credits) subject.credits = credits;
    if (semester) subject.semester = semester;
    if (department) subject.department = department;
    if (teacherId !== undefined) subject.teacher = teacherId || null;

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

async function deleteSubjectHandler(req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    
    const { id } = await params;
    
    // Find subject
    const subject = await Subject.findById(id);
    if (!subject) {
      return NextResponse.json(
        { success: false, message: 'Subject not found' },
        { status: 404 }
      );
    }

    // Check permissions - only admins can delete subjects
    if (req.user?.role !== 'Admin') {
      return NextResponse.json(
        { success: false, message: 'Only admins can delete subjects' },
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
function withParams(handler: (req: AuthenticatedRequest, { params }: { params: Promise<{ id: string }> }) => Promise<NextResponse>) {
  return async function(req: AuthenticatedRequest) {
    const id = req.nextUrl?.pathname.split('/').pop() || '';
    return handler(req, { params: Promise.resolve({ id }) });
  };
}

export const GET = withAuth(withParams(getSubjectHandler), ['Student', 'Teacher', 'Admin']);
export const PUT = withAuth(withParams(updateSubjectHandler), ['Admin']);
export const DELETE = withAuth(withParams(deleteSubjectHandler), ['Admin']);
