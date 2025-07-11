import mongoose from 'mongoose';
import { Document, Types } from 'mongoose';

export type UserRole = 'Admin' | 'Teacher' | 'Student' | 'Parent' | 'Alumni';

export interface IUser extends Document {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  profilePicture?: string;
  phone?: string;
  dateOfBirth?: Date;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  studentId?: string;
  employeeId?: string;
  department?: string;
  course?: string;
  semester?: number;
  year?: number;
  children?: Types.ObjectId[];
  graduationYear?: number;
  currentCompany?: string;
  jobTitle?: string;
  isActive: boolean;
  isVerified: boolean;
  verificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  fullName: string;
  isLocked: boolean;
  comparePassword(candidatePassword: string): Promise<boolean>;
  incLoginAttempts(): Promise<any>;
  resetLoginAttempts(): Promise<any>;
}

export interface ISubject extends Document {
  _id: Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  credits: number;
  department: string;
  semester: number;
  year: number;
  teacher: Types.ObjectId;
  schedule: Array<{
    day: string;
    startTime: string;
    endTime: string;
    room: string;
  }>;
  enrolledStudents: Types.ObjectId[];
  attendanceRequired: number;
  maxAbsences: number;
  academicYear: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  enrolledCount: number;
  addStudent(studentId: Types.ObjectId): Promise<ISubject>;
  removeStudent(studentId: Types.ObjectId): Promise<ISubject>;
  isStudentEnrolled(studentId: Types.ObjectId): boolean;
}

export interface IAttendance extends Document {
  _id: Types.ObjectId;
  student: Types.ObjectId;
  subject: Types.ObjectId;
  teacher: Types.ObjectId;
  date: Date;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  qrCodeId?: Types.ObjectId;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  markedAt: Date;
  classStartTime?: Date;
  classEndTime?: Date;
  remarks?: string;
  isVerified: boolean;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  deviceInfo?: {
    userAgent: string;
    ipAddress: string;
    deviceType: string;
  };
  createdAt: Date;
  updatedAt: Date;
  isLate: boolean;
}

// export interface IQRCode extends Document {
//   _id: Types.ObjectId;
//   code: string;
//   token: string;
//   subject: Types.ObjectId;
//   teacher: Types.ObjectId;
//   classDate: Date;
//   startTime: Date;
//   endTime: Date;
//   location: {
//     latitude: number;
//     longitude: number;
//     radius: number;
//     address?: string;
//   };
//   expiresAt: Date;
//   maxScans?: number;
//   scanCount: number;
//   allowedDevices: string[];
//   preventMultipleScans: boolean;
//   isActive: boolean;
//   isExpired: boolean;
//   scannedBy: Array<{
//     student: Types.ObjectId;
//     scannedAt: Date;
//     location?: {
//       latitude: number;
//       longitude: number;
//       accuracy: number;
//     };
//     deviceInfo?: {
//       userAgent: string;
//       ipAddress: string;
//       deviceType: string;
//     };
//   }>;
//   purpose: 'attendance' | 'event' | 'access';
//   description?: string;
//   createdAt: Date;
//   updatedAt: Date;
//   isValid: boolean;
//   remainingTime: number;
//   isLocationValid(latitude: number, longitude: number): boolean;
//   calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
//   recordScan(studentId: Types.ObjectId, scanData?: any): Promise<IQRCode>;
//   validateScan(studentId: Types.ObjectId, location?: any, deviceInfo?: any): { isValid: boolean; errors: string[] };
// }
export interface IQRCode {
  code: string;
  token: string;
  qrCodeImage?: string;
  subject: mongoose.Types.ObjectId;
  teacher: mongoose.Types.ObjectId;
  classDate: Date;
  startTime: Date;
  endTime: Date;
  location: {
    latitude: number;
    longitude: number;
    radius?: number;
    address?: string;
  };
  expiresAt: Date;
  maxScans?: number | null;
  scanCount?: number;
  allowedDevices?: string[];
  preventMultipleScans?: boolean;
  isActive?: boolean;
  isExpired?: boolean;
  scannedBy?: Array<{
    student: mongoose.Types.ObjectId;
    scannedAt?: Date;
    location?: {
      latitude?: number;
      longitude?: number;
      accuracy?: number;
    };
    deviceInfo?: {
      userAgent?: string;
      ipAddress?: string;
      deviceType?: string;
    };
  }>;
  purpose?: 'attendance' | 'event' | 'access';
  description?: string;
}
export interface IMessage {
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  timestamp: Date;
}

export interface IChat extends Document {
  _id: Types.ObjectId;
  chatId: string;
  type: 'direct' | 'group' | 'class' | 'announcement';
  participants: Array<{
    user: Types.ObjectId;
    role: 'admin' | 'moderator' | 'member';
    joinedAt: Date;
    lastSeen: Date;
    unreadCount: number;
  }>;
  name?: string;
  description?: string;
  avatar?: string;
  subject?: Types.ObjectId;
  settings: {
    allowFileSharing: boolean;
    maxFileSize: number;
    allowedFileTypes: string[];
    muteNotifications: boolean;
    requireApproval: boolean;
  };
  messages: IMessage[];
  lastMessage: {
    content: string;
    sender: Types.ObjectId;
    timestamp: Date;
    type: string;
  };
  isActive: boolean;
  isArchived: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  addParticipant(userId: Types.ObjectId, role?: string): Promise<IChat>;
  removeParticipant(userId: Types.ObjectId): Promise<IChat>;
  updateParticipantRole(userId: Types.ObjectId, newRole: string): Promise<IChat>;
  addMessage(senderId: Types.ObjectId, messageData: any): Promise<IChat>;
  markAsRead(userId: Types.ObjectId): Promise<IChat>;
  getUnreadCount(userId: Types.ObjectId): number;
}

export interface INotification extends Document {
  _id: Types.ObjectId;
  recipient: Types.ObjectId;
  sender?: Types.ObjectId;
  title: string;
  message: string;
  type: 'attendance_alert' | 'attendance_marked' | 'low_attendance' | 'qr_generated' | 'assignment_due' | 'grade_updated' | 'announcement' | 'chat_message' | 'system_update' | 'account_activity' | 'schedule_change' | 'exam_reminder' | 'fee_reminder' | 'general';
  category: 'academic' | 'administrative' | 'social' | 'system' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  relatedEntity?: {
    entityType: string;
    entityId: Types.ObjectId;
  };
  data: any;
  actionUrl?: string;
  actionText?: string;
  isRead: boolean;
  readAt?: Date;
  deliveryStatus: {
    push: {
      sent: boolean;
      sentAt?: Date;
      delivered: boolean;
      deliveredAt?: Date;
      error?: string;
    };
    email: {
      sent: boolean;
      sentAt?: Date;
      delivered: boolean;
      deliveredAt?: Date;
      error?: string;
    };
    sms: {
      sent: boolean;
      sentAt?: Date;
      delivered: boolean;
      deliveredAt?: Date;
      error?: string;
    };
  };
  scheduledFor?: Date;
  expiresAt?: Date;
  metadata: {
    deviceInfo?: {
      userAgent: string;
      deviceType: string;
      platform: string;
    };
    source: 'system' | 'manual' | 'automated' | 'triggered';
    batchId?: string;
    templateId?: string;
    tags: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  isExpired: boolean;
  timeAgo: string;
  markAsRead(): Promise<INotification>;
  updateDeliveryStatus(channel: string, status: string, error?: string): Promise<INotification>;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  studentId?: string;
  employeeId?: string;
  department?: string;
  course?: string;
  semester?: number;
  year?: number;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// Attendance types
export interface AttendanceStats {
  percentage: number;
  totalClasses: number;
  presentClasses: number;
  absentClasses: number;
}

export interface QRCodeData {
  subjectId: string;
  classStartTime: string;
  classEndTime: string;
  location: {
    latitude: number;
    longitude: number;
    radius: number;
    address?: string;
  };
  expiryMinutes: number;
}

// Chat types
export interface ChatMessage {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  type: 'text' | 'image' | 'file' | 'system';
  timestamp: Date;
  fileUrl?: string;
  fileName?: string;
}

export interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'moderator' | 'member';
  isOnline: boolean;
  lastSeen: Date;
}

// Socket.IO types
export interface SocketUser {
  userId: string;
  socketId: string;
  role: UserRole;
}

export interface TypingData {
  chatId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

// Analytics types
export interface AttendanceTrend {
  date: string;
  totalClasses: number;
  presentCount: number;
  attendanceRate: number;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalSubjects: number;
  averageAttendance: number;
  activeQRCodes: number;
  unreadNotifications: number;
}
