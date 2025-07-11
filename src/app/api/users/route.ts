import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/models/User';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware';

async function getUsersHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const department = searchParams.get('department');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query
    const query: any = { isActive: true };
    
    if (role) {
      query.role = role;
    }
    
    if (department) {
      query.department = department;
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }

    // Check permissions
    if (req.user?.role === 'Student') {
      // Students can only see basic info of other users
      query._id = req.user.userId;
    } else if (req.user?.role === 'Parent') {
      // Parents can see their children and teachers
      // This would need to be implemented based on parent-child relationships
    }

    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .select('-password -verificationToken -passwordResetToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    return NextResponse.json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve users' },
      { status: 500 }
    );
  }
}

async function getUserProfileHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();
    
    const userId = req.user?.userId;
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User profile retrieved successfully',
      data: { user }
    });

  } catch (error: any) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve user profile' },
      { status: 500 }
    );
  }
}

async function updateUserProfileHandler(req: AuthenticatedRequest) {
  try {
    await connectDB();
    
    const userId = req.user?.userId;
    const updateData = await req.json();

    // Remove sensitive fields that shouldn't be updated through this endpoint
    delete updateData.password;
    delete updateData.email;
    delete updateData.role;
    delete updateData.isActive;
    delete updateData.isVerified;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });

  } catch (error: any) {
    console.error('Update user profile error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, message: messages.join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getUsersHandler, ['Teacher', 'Admin', 'Student']);
export const PUT = withAuth(updateUserProfileHandler, ['Teacher', 'Admin', 'Student']);
