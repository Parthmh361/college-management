import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { QRCode as QRCodeModel } from '@/models/QRCode';
import { Attendance } from '@/models/Attendance';
import { Subject } from '@/models/Subject';
import { Notification } from '@/models/Notification';
import { withAuth } from '@/lib/middleware';

interface ScanData {
  code: string;
  token: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  deviceInfo?: {
    userAgent: string;
    deviceType: string;
  };
}

async function scanQRCodeHandler(req: any) {
  try {
    await connectDB();
    
    const body: ScanData = await req.json();
    const { code, token, location, deviceInfo } = body;
    const user = req.user;

    // Validate required fields
    if (!code || !token) {
      return NextResponse.json(
        { success: false, message: 'QR code and token are required' },
        { status: 400 }
      );
    }

    // Find QR code record
    const qrCode = await QRCodeModel.findOne({ code, token })
      .populate('subject', 'name code enrolledStudents')
      .populate('teacher', 'firstName lastName');

    if (!qrCode) {
      return NextResponse.json(
        { success: false, message: 'Invalid QR code' },
        { status: 404 }
      );
    }

    // Check if student is enrolled in the subject
    const subject = qrCode.subject as any;
    if (!subject.enrolledStudents.includes(user?.userId)) {
      return NextResponse.json(
        { success: false, message: 'You are not enrolled in this subject' },
        { status: 403 }
      );
    }

    // Validate scan attempt
    const validation = qrCode.validateScan(user?.userId, location, deviceInfo);
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: validation.errors.join(', ') },
        { status: 400 }
      );
    }

    // Get client IP address
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Record the scan
    const scanData = {
      location,
      deviceInfo: {
        ...deviceInfo,
        ipAddress,
        userAgent: req.headers.get('user-agent') || 'unknown'
      }
    };

    await qrCode.recordScan(user?.userId, scanData);

    // Check if attendance already exists for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      student: user?.userId,
      subject: qrCode.subject,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    let attendance;
    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = 'Present';
      existingAttendance.markedAt = new Date();
      existingAttendance.qrCodeId = qrCode._id;
      existingAttendance.location = location;
      existingAttendance.deviceInfo = scanData.deviceInfo;
      
      // Check if late
      if (qrCode.startTime && new Date() > qrCode.startTime) {
        existingAttendance.status = 'Late';
      }
      
      attendance = await existingAttendance.save();
    } else {
      // Create new attendance record
      const status = (qrCode.startTime && new Date() > qrCode.startTime) ? 'Late' : 'Present';
      
      attendance = new Attendance({
        student: req.user?.userId,
        subject: qrCode.subject,
        teacher: qrCode.teacher,
        date: new Date(),
        status,
        qrCodeId: qrCode._id,
        location,
        markedAt: new Date(),
        classStartTime: qrCode.startTime,
        classEndTime: qrCode.endTime,
        deviceInfo: scanData.deviceInfo
      });
      
      await attendance.save();
    }

    // Create notification for successful attendance
    await Notification.create({
      recipient: req.user?.userId,
      title: 'Attendance Marked',
      message: `Your attendance has been marked as ${attendance.status} for ${subject.name}`,
      type: 'attendance_marked',
      category: 'academic',
      priority: 'medium',
      relatedEntity: {
        entityType: 'attendance',
        entityId: attendance._id
      },
      data: {
        subjectName: subject.name,
        status: attendance.status,
        timestamp: attendance.markedAt
      }
    });

    // Populate attendance for response
    await attendance.populate('subject', 'name code');

    return NextResponse.json({
      success: true,
      message: `Attendance marked as ${attendance.status}`,
      data: {
        attendance: {
          id: attendance._id,
          status: attendance.status,
          markedAt: attendance.markedAt,
          subject: {
            name: subject.name,
            code: subject.code
          },
          isLate: attendance.status === 'Late'
        },
        qrCode: {
          subject: subject.name,
          teacher: qrCode.teacher,
          classTime: {
            start: qrCode.startTime,
            end: qrCode.endTime
          }
        }
      }
    });

  } catch (error: any) {
    console.error('QR scan error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process QR code scan' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(scanQRCodeHandler, ['Student']);
