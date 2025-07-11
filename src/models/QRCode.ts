import mongoose, { Schema } from 'mongoose';
import crypto from 'crypto';
import { IQRCode } from '@/types';

const qrCodeSchema = new Schema<IQRCode>({
  // QR Code identification
  code: {
    type: String,
    required: true,
    unique: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  
  // QR Code image (base64 data URL)
  qrCodeImage: {
    type: String,
    required: false
  },
  
  // Associated entities
  subject: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Class session details
  classDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  
  // Location constraints
  location: {
    latitude: {
      type: Number,
      required: true
    },
    longitude: {
      type: Number,
      required: true
    },
    radius: {
      type: Number,
      default: 50, // meters
      min: [10, 'Radius must be at least 10 meters'],
      max: [500, 'Radius cannot be more than 500 meters']
    },
    address: {
      type: String,
      trim: true
    }
  },
  
  // QR Code settings
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  maxScans: {
    type: Number,
    default: null // null means unlimited
  },
  scanCount: {
    type: Number,
    default: 0
  },
  
  // Security settings
  allowedDevices: [{
    type: String // Device fingerprint or identifier
  }],
  preventMultipleScans: {
    type: Boolean,
    default: true
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isExpired: {
    type: Boolean,
    default: false
  },
  
  // Tracking
  scannedBy: [{
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    scannedAt: {
      type: Date,
      default: Date.now
    },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracy: { type: Number }
    },
    deviceInfo: {
      userAgent: { type: String },
      ipAddress: { type: String },
      deviceType: { type: String }
    }
  }],
  
  // Additional metadata
  purpose: {
    type: String,
    enum: {
      values: ['attendance', 'event', 'access'],
      message: 'Purpose must be one of: attendance, event, access'
    },
    default: 'attendance'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot be longer than 200 characters']
  }
}, {
  timestamps: true
});

// Index for better performance (token and expiresAt already have indexes from schema)
qrCodeSchema.index({ teacher: 1, classDate: -1 });
qrCodeSchema.index({ subject: 1, classDate: -1 });
qrCodeSchema.index({ isActive: 1, isExpired: 1 });

// Virtual for checking if QR code is valid
qrCodeSchema.virtual('isValid').get(function() {
  const now = new Date();
  return this.isActive && 
         !this.isExpired && 
         this.expiresAt > now &&
         (this.maxScans === null || this.maxScans === undefined || (typeof this.scanCount === 'number' ? this.scanCount : 0) < this.maxScans);
});

// Virtual for remaining time
qrCodeSchema.virtual('remainingTime').get(function() {
  const now = new Date();
  if (this.expiresAt <= now) return 0;
  return Math.floor((this.expiresAt.getTime() - now.getTime()) / 1000); // seconds
});

// Static method to generate unique QR code
qrCodeSchema.statics.generateUniqueCode = async function() {
  let code = '';
  let exists = true;
  
  while (exists) {
    // Generate a random code
    code = crypto.randomBytes(16).toString('hex').toUpperCase();
    
    // Check if it already exists
    const existingCode = await this.findOne({ code });
    exists = !!existingCode;
  }
  
  return code;
};

// Static method to generate secure token
qrCodeSchema.statics.generateSecureToken = function() {
  return crypto.randomBytes(32).toString('hex');
};

// Method to check if location is within allowed radius
qrCodeSchema.methods.isLocationValid = function(latitude: number, longitude: number) {
  if (!this.location.latitude || !this.location.longitude) {
    return true; // No location restriction
  }
  
  const distance = this.calculateDistance(
    latitude, 
    longitude, 
    this.location.latitude, 
    this.location.longitude
  );
  
  return distance <= this.location.radius;
};

// Method to calculate distance between two points (Haversine formula)
qrCodeSchema.methods.calculateDistance = function(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

// Method to record a scan
qrCodeSchema.methods.recordScan = function(studentId: mongoose.Types.ObjectId, scanData: any = {}) {
  // Check if student already scanned (if preventMultipleScans is true)
  if (this.preventMultipleScans) {
    const alreadyScanned = this.scannedBy.some(
      (scan: any) => scan.student.toString() === studentId.toString()
    );
    
    if (alreadyScanned) {
      throw new Error('Student has already scanned this QR code');
    }
  }
  
  // Add scan record
  this.scannedBy.push({
    student: studentId,
    scannedAt: new Date(),
    location: scanData.location,
    deviceInfo: scanData.deviceInfo
  });
  
  // Increment scan count
  this.scanCount += 1;
  
  // Check if max scans reached
  if (this.maxScans && this.scanCount >= this.maxScans) {
    this.isActive = false;
  }
  
  return this.save();
};

// Method to validate scan attempt
qrCodeSchema.methods.validateScan = function(studentId: mongoose.Types.ObjectId, location?: any, deviceInfo?: any) {
  const errors: string[] = [];
  
  // Check if QR code is valid
  if (!this.isValid) {
    errors.push('QR code is no longer valid');
  }
  
  // Check expiry
  if (this.expiresAt <= new Date()) {
    errors.push('QR code has expired');
  }
  
  // Check location if required
  if (location && !this.isLocationValid(location.latitude, location.longitude)) {
    errors.push('You are not within the required location to scan this QR code');
  }
  
  // Check if student already scanned
  if (this.preventMultipleScans) {
    const alreadyScanned = this.scannedBy.some(
      (scan: any) => scan.student.toString() === studentId.toString()
    );
    
    if (alreadyScanned) {
      errors.push('You have already scanned this QR code');
    }
  }
  
  // Check max scans
  if (this.maxScans && this.scanCount >= this.maxScans) {
    errors.push('Maximum scan limit reached for this QR code');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Static method to cleanup expired QR codes
qrCodeSchema.statics.cleanupExpired = function() {
  return this.updateMany(
    { 
      expiresAt: { $lte: new Date() },
      isExpired: false 
    },
    { 
      $set: { 
        isExpired: true,
        isActive: false 
      } 
    }
  );
};

// Pre-save middleware
qrCodeSchema.pre('save', function(next) {
  // Check if expired
  if (this.expiresAt <= new Date()) {
    this.isExpired = true;
    this.isActive = false;
  }
  
  next();
});

// Static method to find active QR codes by teacher
qrCodeSchema.statics.findActiveByTeacher = function(teacherId: mongoose.Types.ObjectId) {
  return this.find({
    teacher: teacherId,
    isActive: true,
    isExpired: false,
    expiresAt: { $gt: new Date() }
  })
  .select('code token qrCodeImage startTime endTime location expiresAt isActive scannedBy subject')
  .populate('subject', 'name code')
  .sort({ createdAt: -1 });
};

export const QRCode = mongoose.models.QRCode || mongoose.model<IQRCode>('QRCode', qrCodeSchema);
