import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import jwt from 'jsonwebtoken';

// PUT - Update department
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

    const { name, code } = await request.json();

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 });
    }

    // Check if another department with same name or code exists (excluding current one)
    const existingDept = await User.findOne({
      role: 'Department',
      _id: { $ne: params.id },
      $or: [
        { 'department.name': { $regex: new RegExp(`^${name}$`, 'i') } },
        { 'department.code': { $regex: new RegExp(`^${code}$`, 'i') } }
      ]
    });

    if (existingDept) {
      return NextResponse.json({ error: 'Department name or code already exists' }, { status: 409 });
    }

    // Update department
    const updatedDept = await User.findByIdAndUpdate(
      params.id,
      {
        'department.name': name,
        'department.code': code
      },
      { new: true }
    );

    if (!updatedDept) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Also update all students with this department code
    await User.updateMany(
      { role: 'Student', department: updatedDept.department.code },
      { department: code }
    );

    return NextResponse.json({ message: 'Department updated successfully' });
  } catch (error) {
    console.error('Error updating department:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete department
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

    // Find the department to get its code
    const department = await User.findById(params.id);
    if (!department || department.role !== 'Department') {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Delete all students in this department
    await User.deleteMany({ 
      role: 'Student', 
      department: department.department.code 
    });

    // Delete the department
    await User.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Department and associated students deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
