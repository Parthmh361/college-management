import mongoose, { Schema } from 'mongoose';
import { IAttendance } from '@/types';

const attendanceSchema = new Schema<IAttendance>({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  subject: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required']
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher is required']
  },
  
  // Attendance details
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    required: true,
    enum: {
      values: ['Present', 'Absent', 'Late', 'Excused'],
      message: 'Status must be one of: Present, Absent, Late, Excused'
    },
    default: 'Present'
  },
  
  // QR Code related
  qrCodeId: {
    type: Schema.Types.ObjectId,
    ref: 'QRCode'
  },
  
  // Location data (from QR scan)
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    accuracy: { type: Number }
  },
  
  // Time tracking
  markedAt: {
    type: Date,
    default: Date.now
  },
  classStartTime: {
    type: Date
  },
  classEndTime: {
    type: Date
  },
  
  // Additional information
  remarks: {
    type: String,
    trim: true,
    maxlength: [200, 'Remarks cannot be longer than 200 characters']
  },
  
  // Verification
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  
  // Device information
  deviceInfo: {
    userAgent: { type: String },
    ipAddress: { type: String },
    deviceType: { type: String }
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate attendance for same student, subject, and date
attendanceSchema.index({ 
  student: 1, 
  subject: 1, 
  date: 1 
}, { 
  unique: true,
  partialFilterExpression: { status: { $ne: 'Absent' } }
});

// Index for better performance
attendanceSchema.index({ teacher: 1, date: -1 });
attendanceSchema.index({ subject: 1, date: -1 });
attendanceSchema.index({ student: 1, date: -1 });
attendanceSchema.index({ qrCodeId: 1 });

// Virtual for attendance percentage calculation
attendanceSchema.virtual('isLate').get(function() {
  if (!this.classStartTime || !this.markedAt) return false;
  return this.markedAt > this.classStartTime;
});

// Method to calculate attendance percentage for a student in a subject
attendanceSchema.statics.calculateAttendancePercentage = async function(
  studentId: mongoose.Types.ObjectId, 
  subjectId: mongoose.Types.ObjectId, 
  startDate?: string, 
  endDate?: string
) {
  const matchConditions: any = {
    student: studentId,
    subject: subjectId
  };

  if (startDate && endDate) {
    matchConditions.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const pipeline = [
    { $match: matchConditions },
    {
      $group: {
        _id: null,
        totalClasses: { $sum: 1 },
        presentClasses: {
          $sum: {
            $cond: [
              { $in: ['$status', ['Present', 'Late']] },
              1,
              0
            ]
          }
        }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  
  if (result.length === 0) {
    return { percentage: 0, totalClasses: 0, presentClasses: 0 };
  }
  
  const { totalClasses, presentClasses } = result[0];
  const percentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;
  
  return {
    percentage: Math.round(percentage * 100) / 100,
    totalClasses,
    presentClasses,
    absentClasses: totalClasses - presentClasses
  };
};

// Method to get attendance summary for a student
attendanceSchema.statics.getStudentAttendanceSummary = async function(
  studentId: mongoose.Types.ObjectId, 
  academicYear?: string
) {
  const matchConditions: any = {
    student: studentId
  };

  const pipeline: any[] = [
    { $match: matchConditions },
    {
      $lookup: {
        from: 'subjects',
        localField: 'subject',
        foreignField: '_id',
        as: 'subjectDetails'
      }
    },
    { $unwind: '$subjectDetails' }
  ];

  if (academicYear) {
    pipeline.push({
      $match: {
        'subjectDetails.academicYear': academicYear
      }
    });
  }

  pipeline.push(
    {
      $group: {
        _id: {
          subject: '$subject',
          subjectName: '$subjectDetails.name',
          subjectCode: '$subjectDetails.code'
        },
        totalClasses: { $sum: 1 },
        presentClasses: {
          $sum: {
            $cond: [
              { $in: ['$status', ['Present', 'Late']] },
              1,
              0
            ]
          }
        },
        lateClasses: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'Late'] },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $addFields: {
        percentage: {
          $multiply: [
            { $divide: ['$presentClasses', '$totalClasses'] },
            100
          ]
        }
      }
    },
    { $sort: { '_id.subjectName': 1 } }
  );
  
  return this.aggregate(pipeline);
};

// Method to get attendance trends
attendanceSchema.statics.getAttendanceTrends = async function(filters: any = {}) {
  const matchStage: any = {};
  
  if (filters.studentId) {
    matchStage.student = filters.studentId;
  }
  if (filters.subjectId) {
    matchStage.subject = filters.subjectId;
  }
  if (filters.teacherId) {
    matchStage.teacher = filters.teacherId;
  }
  if (filters.startDate && filters.endDate) {
    matchStage.date = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }
  
  const pipeline: any[] = [
    { $match: matchStage },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' },
          day: { $dayOfMonth: '$date' }
        },
        totalClasses: { $sum: 1 },
        presentCount: {
          $sum: {
            $cond: [
              { $in: ['$status', ['Present', 'Late']] },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $addFields: {
        date: {
          $dateFromParts: {
            year: '$_id.year',
            month: '$_id.month',
            day: '$_id.day'
          }
        },
        attendanceRate: {
          $multiply: [
            { $divide: ['$presentCount', '$totalClasses'] },
            100
          ]
        }
      }
    },
    { $sort: { date: 1 } }
  ];
  
  return this.aggregate(pipeline);
};

// Pre-save middleware to set default values
attendanceSchema.pre('save', function(next) {
  // Set markedAt if not already set
  if (!this.markedAt) {
    this.markedAt = new Date();
  }
  
  // Determine if student is late
  if (this.classStartTime && this.markedAt > this.classStartTime && this.status === 'Present') {
    this.status = 'Late';
  }
  
  next();
});

export const Attendance = mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', attendanceSchema);
