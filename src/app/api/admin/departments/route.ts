import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { withAuth } from '@/lib/middleware';
import {User} from '@/models/User';
import Department from '@/models/Department'; // You'll need to create this model

// GET /api/admin/departments - Get all departments with structure
export const GET = withAuth(async (request: Request) => {
  try {
    await connectToDatabase();

    // Get departments from both User aggregation (existing departments with users) 
    // and Department collection (newly created departments)
    const [userDepartments, createdDepartments] = await Promise.all([
      // Existing aggregation for departments with users
      User.aggregate([
        {
          $match: { 
            department: { $exists: true, $ne: null },
            // To check for non-empty string, use $and
            // department: { $exists: true, $ne: null, $ne: '' }, // <-- invalid
            role: 'Student' 
          }
        },
        {
          $group: {
            _id: '$department',
            name: { $first: '$department' },
            code: { $first: '$department' },
            semesters: { $addToSet: '$semester' },
            sections: { $addToSet: '$section' },
            studentCount: { $sum: 1 }
          }
        },
        {
          $sort: { name: 1 }
        }
      ]),
      
      // Get departments from Department collection (newly created ones)
      Department.find({}).lean()
    ]);

    // Merge the results, giving priority to user departments (they have real data)
    const departmentMap = new Map();
    
    // Add user departments first (they have real student data)
    userDepartments.forEach(dept => {
      interface UserDepartment {
        _id: string;
        name: string;
        code: string;
        semesters: (string | null)[];
        sections: (string | null)[];
        studentCount: number;
      }

      interface CreatedDepartment {
        _id: string;
        name: string;
        code: string;
        semesters?: string[];
        sections?: string[];
      }

      const departmentMap: Map<string, {
        _id: string;
        name: string;
        code: string;
        semesters: string[];
        sections: string[];
        studentCount: number;
      }> = new Map();

      (userDepartments as UserDepartment[]).forEach((dept: UserDepartment) => {
        departmentMap.set(dept._id, {
          _id: dept._id,
          name: dept.name,
          code: dept.code,
          semesters: dept.semesters.filter((s): s is string => s != null).sort(),
          sections: dept.sections.filter((s): s is string => s != null).sort(),
          studentCount: dept.studentCount
        });
      });
    });
    
    // Add created departments that don't have users yet
    createdDepartments.forEach(dept => {
      if (!departmentMap.has(dept.code)) {
        departmentMap.set(dept.code, {
          _id: dept._id,
          name: dept.name,
          code: dept.code,
          semesters: dept.semesters || [],
          sections: dept.sections || [],
          studentCount: 0
        });
      }
    });

    const departments = Array.from(departmentMap.values());

    return NextResponse.json({
      message: 'Departments retrieved successfully',
      departments
    });

  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch departments' },
      { status: 500 }
    );
  }
});

// POST /api/admin/departments - Create a new department
export const POST = withAuth(async (request: Request) => {
  try {
    await connectToDatabase();
    
    const { name, code } = await request.json();
    
    // Validation
    if (!name || !code) {
      return NextResponse.json(
        { error: 'Department name and code are required' },
        { status: 400 }
      );
    }

    // Check if department already exists
    const existingDepartment = await Department.findOne({
      $or: [
        { name: name },
        { code: code }
      ]
    });

    if (existingDepartment) {
      return NextResponse.json(
        { error: 'Department with this name or code already exists' },
        { status: 409 }
      );
    }

    // Create new department
    const department = new Department({
      name,
      code,
      semesters: [],
      sections: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await department.save();

    return NextResponse.json({
      message: 'Department structure noted. Add users to activate department.',
      department: {
        _id: department._id,
        name: department.name,
        code: department.code,
        semesters: department.semesters,
        sections: department.sections
      }
    });

  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      { error: 'Failed to create department' },
      { status: 500 }
    );
  }
});
