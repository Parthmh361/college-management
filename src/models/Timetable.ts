import mongoose from 'mongoose';

interface ITimeSlot {
  startTime: string; // "09:00"
  endTime: string;   // "10:00"
  subject: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  room: string;
  type: 'lecture' | 'lab' | 'tutorial' | 'break';
}

interface ITimetableEntry {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  timeSlots: ITimeSlot[];
}

interface ISection {
  sectionName: string; // "A", "B", "C", etc.
  schedule: ITimetableEntry[];
}

interface ITimetable extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  semester: number;
  department: string;
  academicYear: string; // "2024-25"
  sections: ISection[]; // Changed from schedule to sections
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TimeSlotSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  endTime: {
    type: String,
    required: true,
    match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  room: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['lecture', 'lab', 'tutorial', 'break'],
    default: 'lecture'
  }
});

const TimetableEntrySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    required: true
  },
  timeSlots: [TimeSlotSchema]
});

const SectionSchema = new mongoose.Schema({
  sectionName: {
    type: String,
    required: true,
    uppercase: true,
    match: /^[A-Z]$/
  },
  schedule: [TimetableEntrySchema]
});

const TimetableSchema = new mongoose.Schema({
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  department: {
    type: String,
    required: true
  },
  academicYear: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}$/
  },
  sections: [SectionSchema], // Changed from schedule to sections
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique timetable per semester/department/year
TimetableSchema.index({ semester: 1, department: 1, academicYear: 1 }, { unique: true });

export const Timetable = mongoose.models.Timetable || mongoose.model<ITimetable>('Timetable', TimetableSchema);
export type { ITimetable, ITimetableEntry, ITimeSlot, ISection };
