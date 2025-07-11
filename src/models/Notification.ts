import mongoose, { Schema } from 'mongoose';
import { INotification } from '@/types';

const notificationSchema = new Schema<INotification>({
  // Recipient information
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recipient is required']
  },
  
  // Sender information (optional for system notifications)
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Notification content
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be longer than 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [500, 'Message cannot be longer than 500 characters']
  },
  
  // Notification type and category
  type: {
    type: String,
    required: true,
    enum: {
      values: [
        'attendance_alert',
        'attendance_marked',
        'low_attendance',
        'qr_generated',
        'assignment_due',
        'grade_updated',
        'announcement',
        'chat_message',
        'system_update',
        'account_activity',
        'schedule_change',
        'exam_reminder',
        'fee_reminder',
        'general'
      ],
      message: 'Notification type is invalid'
    }
  },
  category: {
    type: String,
    enum: {
      values: ['academic', 'administrative', 'social', 'system', 'emergency'],
      message: 'Category must be one of: academic, administrative, social, system, emergency'
    },
    default: 'academic'
  },
  
  // Priority level
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: 'Priority must be one of: low, medium, high, urgent'
    },
    default: 'medium'
  },
  
  // Related entities
  relatedEntity: {
    entityType: {
      type: String,
      enum: ['subject', 'attendance', 'qrcode', 'chat', 'user', 'assignment', 'exam']
    },
    entityId: {
      type: Schema.Types.ObjectId
    }
  },
  
  // Notification data
  data: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // Action information
  actionUrl: {
    type: String,
    trim: true
  },
  actionText: {
    type: String,
    trim: true,
    maxlength: [50, 'Action text cannot be longer than 50 characters']
  },
  
  // Status tracking
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  
  // Delivery tracking
  deliveryStatus: {
    push: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      delivered: { type: Boolean, default: false },
      deliveredAt: { type: Date },
      error: { type: String }
    },
    email: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      delivered: { type: Boolean, default: false },
      deliveredAt: { type: Date },
      error: { type: String }
    },
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      delivered: { type: Boolean, default: false },
      deliveredAt: { type: Date },
      error: { type: String }
    }
  },
  
  // Scheduling
  scheduledFor: {
    type: Date
  },
  
  // Expiry
  expiresAt: {
    type: Date
  },
  
  // Metadata
  metadata: {
    deviceInfo: {
      userAgent: { type: String },
      deviceType: { type: String },
      platform: { type: String }
    },
    source: {
      type: String,
      enum: {
        values: ['system', 'manual', 'automated', 'triggered'],
        message: 'Source must be one of: system, manual, automated, triggered'
      },
      default: 'system'
    },
    batchId: { type: String },
    templateId: { type: String },
    tags: [{ type: String }]
  }
}, {
  timestamps: true
});

// Index for better performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ category: 1, priority: 1 });
notificationSchema.index({ scheduledFor: 1 });
notificationSchema.index({ 'relatedEntity.entityType': 1, 'relatedEntity.entityId': 1 });

// TTL index for automatic cleanup of expired notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for checking if notification is expired
notificationSchema.virtual('isExpired').get(function() {
  const self = this as any;
  return self.expiresAt && self.expiresAt <= new Date();
});

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function(this: mongoose.Document & { createdAt: Date }) {
  const now = new Date();
  const diff = now.getTime() - this.createdAt.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
});

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Method to update delivery status
notificationSchema.methods.updateDeliveryStatus = function(channel: string, status: string, error?: string) {
  if (!this.deliveryStatus[channel as keyof typeof this.deliveryStatus]) {
    this.deliveryStatus[channel as keyof typeof this.deliveryStatus] = {
      sent: false,
      delivered: false,
      error: undefined,
      sentAt: undefined,
      deliveredAt: undefined
    };
  }
  
  const channelStatus = this.deliveryStatus[channel as keyof typeof this.deliveryStatus];
  (channelStatus as any)[status] = true;
  (channelStatus as any)[`${status}At`] = new Date();
  
  if (error) {
    (channelStatus as any).error = error;
  }
  
  return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(notificationData: any) {
  // Set default expiry if not provided (30 days)
  if (!notificationData.expiresAt) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);
    notificationData.expiresAt = expiryDate;
  }
  
  const notification = new this(notificationData);
  return notification.save();
};

// Static method to create bulk notifications
notificationSchema.statics.createBulkNotifications = async function(recipients: mongoose.Types.ObjectId[], notificationTemplate: any) {
  const batchId = new mongoose.Types.ObjectId().toString();
  
  const notifications = recipients.map(recipientId => ({
    ...notificationTemplate,
    recipient: recipientId,
    'metadata.batchId': batchId,
    'metadata.source': 'automated'
  }));
  
  return this.insertMany(notifications);
};

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = function(userId: mongoose.Types.ObjectId) {
  return this.countDocuments({
    recipient: userId,
    isRead: false,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });
};

// Static method to get notifications for user with pagination
notificationSchema.statics.getNotificationsForUser = function(userId: mongoose.Types.ObjectId, options: any = {}) {
  const query: any = {
    recipient: userId,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  };
  
  // Filter by read status
  if (options.unreadOnly) {
    query.isRead = false;
  }
  
  // Filter by type
  if (options.type) {
    query.type = options.type;
  }
  
  // Filter by category
  if (options.category) {
    query.category = options.category;
  }
  
  // Filter by priority
  if (options.priority) {
    query.priority = options.priority;
  }
  
  const queryBuilder = this.find(query)
    .populate('sender', 'firstName lastName avatar')
    .sort({ createdAt: -1 });
  
  // Pagination
  if (options.page && options.limit) {
    const skip = (options.page - 1) * options.limit;
    queryBuilder.skip(skip).limit(options.limit);
  } else if (options.limit) {
    queryBuilder.limit(options.limit);
  }
  
  return queryBuilder;
};

// Static method to mark multiple notifications as read
notificationSchema.statics.markMultipleAsRead = function(userId: mongoose.Types.ObjectId, notificationIds: mongoose.Types.ObjectId[]) {
  return this.updateMany(
    {
      _id: { $in: notificationIds },
      recipient: userId
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  );
};

// Static method to mark all notifications as read for user
notificationSchema.statics.markAllAsRead = function(userId: mongoose.Types.ObjectId) {
  return this.updateMany(
    {
      recipient: userId,
      isRead: false
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  );
};

// Pre-save middleware
notificationSchema.pre('save', function(this: mongoose.Document & INotification, next) {
  // Set read timestamp when marking as read
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  
  next();
});

export const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);
