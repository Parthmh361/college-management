import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Attendance } from '@/models/Attendance';
import { User } from '@/models/User';
import { Subject } from '@/models/Subject';
import { QRCode } from '@/models/QRCode';
import { verifyToken } from '@/lib/auth';
import { requireRole } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user to check role
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const period = searchParams.get('period') || '30'; // days
    const subjectId = searchParams.get('subjectId');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    let analytics: any = {};

    switch (type) {
      case 'overview':
        analytics = await getOverviewAnalytics(decoded.userId, user.role, startDate);
        break;
      case 'admin':
        // Only admins can see admin analytics
        const adminRoleCheck = requireRole(['Admin'])({ ...decoded, role: user.role });
        if (!adminRoleCheck.success) {
          return NextResponse.json({ error: adminRoleCheck.error }, { status: 403 });
        }
        analytics = await getAdminAnalytics(startDate);
        break;
      case 'teacher':
        // Only teachers can see teacher analytics
        const teacherRoleCheck = requireRole(['Teacher'])({ ...decoded, role: user.role });
        if (!teacherRoleCheck.success) {
          return NextResponse.json({ error: teacherRoleCheck.error }, { status: 403 });
        }
        analytics = await getTeacherAnalytics(decoded.userId, startDate);
        break;
      case 'student':
        // Only students can see their own analytics
        const studentRoleCheck = requireRole(['Student'])({ ...decoded, role: user.role });
        if (!studentRoleCheck.success) {
          return NextResponse.json({ error: studentRoleCheck.error }, { status: 403 });
        }
        analytics = await getStudentAnalytics(decoded.userId, startDate);
        break;
      case 'attendance-trends':
        analytics = await getAttendanceTrends(decoded.userId, user.role, startDate, subjectId ?? undefined);
        break;
      case 'subject-performance':
        analytics = await getSubjectPerformance(decoded.userId, user.role, startDate);
        break;
      case 'qr-usage':
        // Only teachers and admins can see QR usage analytics
        const roleCheck = requireRole(['Admin', 'Teacher'])({ ...decoded, role: user.role });
        if (!roleCheck.success) {
          return NextResponse.json({ error: roleCheck.error }, { status: 403 });
        }
        analytics = await getQRUsageAnalytics(startDate);
        break;
      case 'student-performance':
        // Only teachers and admins can see individual student performance
        const performanceRoleCheck = requireRole(['Admin', 'Teacher'])({ ...decoded, role: user.role });
        if (!performanceRoleCheck.success) {
          return NextResponse.json({ error: performanceRoleCheck.error }, { status: 403 });
        }
        analytics = await getStudentPerformanceAnalytics(startDate, subjectId ?? undefined);
        break;
      default:
        return NextResponse.json({ error: 'Invalid analytics type' }, { status: 400 });
    }

    return NextResponse.json({ analytics, period: parseInt(period) });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getOverviewAnalytics(userId: string, userRole: string, startDate: Date) {
  const baseQuery = userRole === 'Student' ? { student: userId } : {};
  
  const totalClasses = await Attendance.countDocuments({
    ...baseQuery,
    date: { $gte: startDate }
  });

  const presentClasses = await Attendance.countDocuments({
    ...baseQuery,
    status: 'present',
    date: { $gte: startDate }
  });

  const absentClasses = await Attendance.countDocuments({
    ...baseQuery,
    status: 'absent',
    date: { $gte: startDate }
  });

  const lateClasses = await Attendance.countDocuments({
    ...baseQuery,
    status: 'late',
    date: { $gte: startDate }
  });

  const attendanceRate = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

  return {
    totalClasses,
    presentClasses,
    absentClasses,
    lateClasses,
    attendanceRate: Math.round(attendanceRate * 100) / 100
  };
}

async function getAdminAnalytics(startDate: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get total counts
  const totalUsers = await User.countDocuments();
  const totalStudents = await User.countDocuments({ role: 'Student' });
  const totalTeachers = await User.countDocuments({ role: 'Teacher' });
  const totalSubjects = await Subject.countDocuments();

  // Get today's attendance
  const totalAttendanceToday = await Attendance.countDocuments({
    date: { $gte: today }
  });

  const presentToday = await Attendance.countDocuments({
    date: { $gte: today },
    status: 'present'
  });

  // Calculate overall attendance rate
  const totalAttendanceRecords = await Attendance.countDocuments({
    date: { $gte: startDate }
  });

  const totalPresentRecords = await Attendance.countDocuments({
    date: { $gte: startDate },
    status: 'present'
  });

  const attendanceRate = totalAttendanceRecords > 0 
    ? Math.round((totalPresentRecords / totalAttendanceRecords) * 100 * 100) / 100
    : 0;

  return {
    totalUsers,
    totalStudents,
    totalTeachers,
    totalSubjects,
    totalAttendanceToday,
    attendanceRate
  };
}

async function getTeacherAnalytics(teacherId: string, startDate: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get teacher's subjects
  const teacherSubjects = await Subject.find({ teacher: teacherId });
  const subjectIds = teacherSubjects.map(s => s._id);

  // Get total classes for this teacher
  const totalClasses = await Attendance.countDocuments({
    subject: { $in: subjectIds },
    date: { $gte: startDate }
  });

  // Get today's classes for this teacher
  const todaysClasses = await Attendance.countDocuments({
    subject: { $in: subjectIds },
    date: { $gte: today }
  });

  // Get students present today
  const studentsPresent = await Attendance.countDocuments({
    subject: { $in: subjectIds },
    date: { $gte: today },
    status: 'present'
  });

  // Calculate attendance rate for teacher's classes
  const totalAttendanceRecords = await Attendance.countDocuments({
    subject: { $in: subjectIds },
    date: { $gte: startDate }
  });

  const totalPresentRecords = await Attendance.countDocuments({
    subject: { $in: subjectIds },
    date: { $gte: startDate },
    status: 'present'
  });

  const attendanceRate = totalAttendanceRecords > 0 
    ? Math.round((totalPresentRecords / totalAttendanceRecords) * 100 * 100) / 100
    : 0;

  // Get total unique students in teacher's classes
  const totalStudents = await Attendance.distinct('student', {
    subject: { $in: subjectIds }
  });

  return {
    totalClasses,
    studentsPresent,
    todaysClasses,
    attendanceRate,
    totalStudents: totalStudents.length
  };
}

async function getStudentAnalytics(studentId: string, startDate: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get total classes for this student
  const totalClasses = await Attendance.countDocuments({
    student: studentId,
    date: { $gte: startDate }
  });

  // Get attended classes (present)
  const attendedClasses = await Attendance.countDocuments({
    student: studentId,
    date: { $gte: startDate },
    status: 'present'
  });

  // Get missed classes (absent)
  const missedClasses = await Attendance.countDocuments({
    student: studentId,
    date: { $gte: startDate },
    status: 'absent'
  });

  // Get today's classes for this student
  const todaysClasses = await Attendance.countDocuments({
    student: studentId,
    date: { $gte: today }
  });

  // Calculate attendance rate
  const attendanceRate = totalClasses > 0 
    ? Math.round((attendedClasses / totalClasses) * 100 * 100) / 100
    : 0;

  return {
    totalClasses,
    attendedClasses,
    missedClasses,
    attendanceRate,
    todaysClasses
  };
}

async function getAttendanceTrends(userId: string, userRole: string, startDate: Date, subjectId?: string) {
  const matchQuery: any = {
    date: { $gte: startDate }
  };

  if (userRole === 'Student') {
    matchQuery.student = userId;
  }

  if (subjectId) {
    matchQuery.subject = subjectId;
  }

  const trends = await Attendance.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
        },
        totalClasses: { $sum: 1 },
        presentClasses: {
          $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
        },
        absentClasses: {
          $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
        },
        lateClasses: {
          $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
        }
      }
    },
    {
      $addFields: {
        attendanceRate: {
          $multiply: [
            { $divide: ['$presentClasses', '$totalClasses'] },
            100
          ]
        }
      }
    },
    { $sort: { '_id.date': 1 } }
  ]);

  return trends;
}

async function getSubjectPerformance(userId: string, userRole: string, startDate: Date) {
  const matchQuery: any = {
    date: { $gte: startDate }
  };

  if (userRole === 'Student') {
    matchQuery.student = userId;
  }

  const performance = await Attendance.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$subject',
        totalClasses: { $sum: 1 },
        presentClasses: {
          $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
        },
        absentClasses: {
          $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
        },
        lateClasses: {
          $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
        }
      }
    },
    {
      $lookup: {
        from: 'subjects',
        localField: '_id',
        foreignField: '_id',
        as: 'subject'
      }
    },
    {
      $addFields: {
        attendanceRate: {
          $multiply: [
            { $divide: ['$presentClasses', '$totalClasses'] },
            100
          ]
        },
        subject: { $arrayElemAt: ['$subject', 0] }
      }
    },
    { $sort: { attendanceRate: -1 } }
  ]);

  return performance;
}

async function getQRUsageAnalytics(startDate: Date) {
  const qrUsage = await QRCode.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
        },
        totalQRCodes: { $sum: 1 },
        activeQRCodes: {
          $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
        },
        expiredQRCodes: {
          $sum: { $cond: [{ $lt: ['$expiresAt', new Date()] }, 1, 0] }
        }
      }
    },
    { $sort: { '_id.date': 1 } }
  ]);

  const totalScans = await Attendance.countDocuments({
    date: { $gte: startDate },
    qrCodeId: { $exists: true }
  });

  return {
    usage: qrUsage,
    totalScans
  };
}

async function getStudentPerformanceAnalytics(startDate: Date, subjectId?: string) {
  const matchQuery: any = {
    date: { $gte: startDate }
  };

  if (subjectId) {
    matchQuery.subject = subjectId;
  }

  const studentPerformance = await Attendance.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$student',
        totalClasses: { $sum: 1 },
        presentClasses: {
          $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
        },
        absentClasses: {
          $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
        },
        lateClasses: {
          $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'student'
      }
    },
    {
      $addFields: {
        attendanceRate: {
          $multiply: [
            { $divide: ['$presentClasses', '$totalClasses'] },
            100
          ]
        },
        student: { $arrayElemAt: ['$student', 0] }
      }
    },
    { $sort: { attendanceRate: -1 } },
    { $limit: 50 } // Limit to top 50 students
  ]);

  return studentPerformance;
}
