import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';

// PUT - Update student
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    // Check authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== 'Admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { firstName, lastName, email, studentId, department, semester, section, password } = await request.json();

    if (!firstName || !lastName || !email || !studentId || !department || !section) {
      return NextResponse.json({ error: 'All fields except password are required' }, { status: 400 });
    }

    // Check if another student with same email or studentId exists (excluding current one)
    const existingStudent = await User.findOne({
      role: 'Student',
      _id: { $ne: params.id },
      $or: [
        { email: { $regex: new RegExp(`^${email}$`, 'i') } },
        { studentId }
      ]
    });

    if (existingStudent) {
      return NextResponse.json({ error: 'Email or Student ID already exists' }, { status: 409 });
    }

    // Prepare update data
    const updateData: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      studentId: string;
      department: string;
      semester: number;
      section: string;
      password?: string;
    }> = {
      firstName,
      lastName,
      email,
      studentId,
      department,
      semester: parseInt(semester),
      section
    };

    // Only update password if provided
    if (password) {
      const hashedPassword = await bcryptjs.hash(password, 12);
      updateData.password = hashedPassword;
    }

    // Update student
    const updatedStudent = await User.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    ).select('-password');

    if (!updatedStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Student updated successfully', student: updatedStudent });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete student
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    // Check authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== 'Admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete the student
    const deletedStudent = await User.findByIdAndDelete(params.id);

    if (!deletedStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
