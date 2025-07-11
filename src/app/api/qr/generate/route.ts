import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import connectDB from '@/lib/mongodb';
import { QRCode as QRCodeModel } from '@/models/QRCode';
import { Subject } from '@/models/Subject';
import { withAuth } from '@/lib/middleware';
import { QRCodeData } from '@/types';

async function generateQRCodeHandler(req: any) {
  try {
    await connectDB();
    
    const body: QRCodeData = await req.json();
    const {
      subjectId,
      classStartTime,
      classEndTime,
      location,
      expiryMinutes = 10
    } = body;

    // Validate required fields
    if (!subjectId || !classStartTime || !classEndTime || !location) {
      return NextResponse.json(
        { success: false, message: 'Subject, start time, end time, and location are required' },
        { status: 400 }
      );
    }

    // Verify subject exists and teacher has permission
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return NextResponse.json(
        { success: false, message: 'Subject not found' },
        { status: 404 }
      );
    }

    // Check if user is the teacher for this subject
    if (subject.teacher.toString() !== req.user?.userId) {
      return NextResponse.json(
        { success: false, message: 'Only the assigned teacher can generate QR codes for this subject' },
        { status: 403 }
      );
    }

    // Generate unique code and token
    const code = await (QRCodeModel as any).generateUniqueCode();
    const token = (QRCodeModel as any).generateSecureToken();

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

    // Generate QR code image
    const qrData = JSON.stringify({
      code,
      token,
      subjectId,
      timestamp: Date.now()
    });

    const qrCodeImage = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    });

    // Create QR code record with the image
    const qrCodeData = {
      code,
      token,
      qrCodeImage, // Store the QR code image
      subject: subjectId,
      teacher: req.user?.userId,
      classDate: new Date(classStartTime),
      startTime: new Date(classStartTime),
      endTime: new Date(classEndTime),
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        radius: location.radius || 50,
        address: location.address
      },
      expiresAt,
      purpose: 'attendance',
      description: `Attendance QR for ${subject.name}`
    };

    const qrCodeRecord = new QRCodeModel(qrCodeData);
    await qrCodeRecord.save();

    return NextResponse.json({
      success: true,
      message: 'QR code generated successfully',
      data: {
        qrCodeId: qrCodeRecord._id,
        code,
        qrCodeImage,
        expiresAt,
        subject: {
          id: subject._id,
          name: subject.name,
          code: subject.code
        },
        location: qrCodeRecord.location,
        validFor: `${expiryMinutes} minutes`
      }
    });

  } catch (error: any) {
    console.error('QR code generation error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate QR code' },
      { status: 500 }
    );
  }
}

async function getActiveQRCodesHandler(req: any) {
  try {
    await connectDB();

    // Get active QR codes for the teacher
    const qrCodes = await (QRCodeModel as any).findActiveByTeacher(req.user?.userId);

    return NextResponse.json({
      success: true,
      message: 'Active QR codes retrieved successfully',
      qrCodes: qrCodes
    });

  } catch (error: any) {
    console.error('Get QR codes error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve QR codes' },
      { status: 500 }
    );
  }
}

export const POST = withAuth(generateQRCodeHandler, ['Teacher', 'Admin']);
export const GET = withAuth(getActiveQRCodesHandler, ['Teacher', 'Admin']);
