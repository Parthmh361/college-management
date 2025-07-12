import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Timetable } from '@/models/Timetable';
import { User } from '@/models/User';
import { verifyToken } from '@/lib/auth';

// GET /api/timetable/current - Get current class for teacher
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

    const user = await User.findById(decoded.userId).select('role department');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'Teacher') {
      return NextResponse.json({ error: 'Access denied. Teachers only.' }, { status: 403 });
    }

    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

    // Find all timetables for teacher's department
    const timetables = await Timetable.find({ 
      department: user.department,
      isActive: true,
      academicYear: '2024-25' // Current academic year
    })
      .populate('schedule.timeSlots.subject', 'name code')
      .populate('schedule.timeSlots.teacher', 'firstName lastName email');

    let currentClasses = [];
    let upcomingClasses = [];

    for (const timetable of timetables) {
    interface TimeSlot {
      _id: string;
      startTime: string;
      endTime: string;
      subject: {
        _id: string;
        name: string;
        code: string;
      };
      teacher: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
      [key: string]: any;
    }

    interface Schedule {
      day: string;
      timeSlots: TimeSlot[];
    }

    interface TimetableType {
      _id: string;
      department: string;
      semester: string;
      schedule: Schedule[];
      [key: string]: any;
    }

    const timetableTyped = timetable as TimetableType;
    const todaySchedule: Schedule | undefined = timetableTyped.schedule.find((s: Schedule) => s.day === currentDay);
      
      if (todaySchedule) {
        for (const timeSlot of todaySchedule.timeSlots) {
          // Check if this teacher has this class
          if (timeSlot.teacher._id.toString() === decoded.userId) {
            const isCurrentClass = currentTime >= timeSlot.startTime && currentTime <= timeSlot.endTime;
            const isUpcoming = currentTime < timeSlot.startTime;

            if (isCurrentClass) {
              currentClasses.push({
                timetableId: timetable._id,
                semester: timetable.semester,
                department: timetable.department,
                timeSlot: {
                  ...timeSlot.toObject(),
                  id: timeSlot._id
                }
              });
            } else if (isUpcoming) {
              upcomingClasses.push({
                timetableId: timetable._id,
                semester: timetable.semester,
                department: timetable.department,
                timeSlot: {
                  ...timeSlot.toObject(),
                  id: timeSlot._id
                }
              });
            }
          }
        }
      }
    }

    // Sort upcoming classes by start time
    upcomingClasses.sort((a, b) => a.timeSlot.startTime.localeCompare(b.timeSlot.startTime));

    return NextResponse.json({
      message: 'Current classes retrieved successfully',
      currentClasses,
      upcomingClasses: upcomingClasses.slice(0, 3), // Next 3 classes
      currentTime,
      currentDay
    });

  } catch (error) {
    console.error('Error fetching current classes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
