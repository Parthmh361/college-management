import mongoose, { Schema } from 'mongoose';
import { ISubject } from '@/types';

const subjectSchema = new Schema<ISubject>({
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true,
    maxlength: [100, 'Subject name cannot be longer than 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Subject code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [20, 'Subject code cannot be longer than 20 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be longer than 500 characters']
  },
  credits: {
    type: Number,
    required: [true, 'Credits are required'],
    min: [1, 'Credits must be at least 1'],
    max: [6, 'Credits cannot be more than 6']
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: [1, 'Semester must be at least 1'],
    max: [8, 'Semester cannot be more than 8']
  },
  year: {
    type: Number,
    default: () => new Date().getFullYear(),
    min: [2020, 'Year must be at least 2020']
  },
  
  // Teacher assignment
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow subjects without teachers initially
  },
  
  // Subject schedule
  schedule: [{
    day: {
      type: String,
      required: true,
      enum: {
        values: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        message: 'Day must be a valid weekday'
      }
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time format (HH:MM)']
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter valid time format (HH:MM)']
    },
    room: {
      type: String,
      required: true,
      trim: true
    }
  }],
  
  // Enrolled students
  enrolledStudents: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Subject settings
  attendanceRequired: {
    type: Number,
    default: 75,
    min: [0, 'Attendance required cannot be negative'],
    max: [100, 'Attendance required cannot be more than 100%']
  },
  maxAbsences: {
    type: Number,
    default: 5,
    min: [0, 'Max absences cannot be negative']
  },
  
  // Academic year
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    match: [/^\d{4}-\d{4}$/, 'Academic year should be in format YYYY-YYYY']
  },
  
  // Subject status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for better performance (code already has unique index from schema)
subjectSchema.index({ teacher: 1 });
subjectSchema.index({ department: 1, semester: 1 });
subjectSchema.index({ academicYear: 1 });

// Virtual for enrolled student count
subjectSchema.virtual('enrolledCount').get(function() {
  return this.enrolledStudents.length;
});

// Method to add student to subject
subjectSchema.methods.addStudent = function(studentId: mongoose.Types.ObjectId) {
  if (!this.enrolledStudents.includes(studentId)) {
    this.enrolledStudents.push(studentId);
    return this.save();
  }
  throw new Error('Student already enrolled in this subject');
};

// Method to remove student from subject
subjectSchema.methods.removeStudent = function(studentId: mongoose.Types.ObjectId) {
  this.enrolledStudents = this.enrolledStudents.filter(
    (id: mongoose.Types.ObjectId) => id.toString() !== studentId.toString()
  );
  return this.save();
};

// Method to check if student is enrolled
subjectSchema.methods.isStudentEnrolled = function(studentId: mongoose.Types.ObjectId) {
  return this.enrolledStudents.some(
    (id: mongoose.Types.ObjectId) => id.toString() === studentId.toString()
  );
};

// Static method to find subjects by teacher
subjectSchema.statics.findByTeacher = function(teacherId: mongoose.Types.ObjectId) {
  return this.find({ teacher: teacherId, isActive: true })
    .populate('teacher', 'firstName lastName email')
    .populate('enrolledStudents', 'firstName lastName studentId');
};

// Static method to find subjects by student
subjectSchema.statics.findByStudent = function(studentId: mongoose.Types.ObjectId) {
  return this.find({ 
    enrolledStudents: studentId, 
    isActive: true 
  })
    .populate('teacher', 'firstName lastName email')
    .select('-enrolledStudents');
};

export const Subject = mongoose.models.Subject || mongoose.model<ISubject>('Subject', subjectSchema);
