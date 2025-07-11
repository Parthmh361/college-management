import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { User } from '@/models/User';
import connectDB from '@/lib/mongodb';
import { UserRole } from '@/types';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  allowedRoles?: UserRole[]
) {
  return async function(req: AuthenticatedRequest): Promise<NextResponse> {
    try {
      // Extract token from Authorization header 
      const authHeader = req.headers.get('authorization');
      const token = extractTokenFromHeader(authHeader);

      if (!token) {
        return NextResponse.json(
          { success: false, message: 'No token provided' },
          { status: 401 }
        );
      }

      // Verify token
      let decoded;
      try {
        decoded = verifyToken(token);
      } catch (tokenError) {
        console.error('Token verification error:', tokenError);
        return NextResponse.json(
          { success: false, message: 'Invalid token' },
          { status: 401 }
        );
      }
      
      // Connect to database
      try {
        await connectDB();
      } catch (dbError) {
        console.error('Database connection error:', dbError);
        return NextResponse.json(
          { success: false, message: 'Database connection failed' },
          { status: 500 }
        );
      }
      
      // Get user from database
      let user;
      try {
        user = await User.findById(decoded.userId).select('-password');
      } catch (userError) {
        console.error('User lookup error:', userError);
        return NextResponse.json(
          { success: false, message: 'User lookup failed' },
          { status: 500 }
        );
      }
      
      if (!user || !user.isActive) {
        return NextResponse.json(
          { success: false, message: 'User not found or inactive' },
          { status: 401 }
        );
      }

      // Check role permissions if specified
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        return NextResponse.json(
          { success: false, message: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // Add user to request
      req.user = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      };

      return await handler(req);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { success: false, message: 'Authentication failed' },
        { status: 500 }
      );
    }
  };
}

// Helper function to check if user has permission
export function hasPermission(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

// Role hierarchy for permission checking
export const roleHierarchy: Record<UserRole, number> = {
  'Admin': 5,
  'Teacher': 4,
  'Student': 3,
  'Parent': 2,
  'Alumni': 1
};

// Check if user role has at least the minimum required level
export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[minimumRole];
}

// Helper function to check role requirements
export function requireRole(allowedRoles: UserRole[]) {
  return (decoded: { userId: string; email: string; role?: UserRole }) => {
    if (!decoded.role || !allowedRoles.includes(decoded.role)) {
      return {
        success: false,
        error: 'Insufficient permissions'
      };
    }
    return { success: true };
  };
}
