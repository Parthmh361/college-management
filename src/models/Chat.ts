import mongoose, { Schema } from 'mongoose';
import { IChat, IMessage } from '@/types';

const messageSchema = new Schema<IMessage>({
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Message content cannot be longer than 1000 characters']
  },
  type: {
    type: String,
    enum: {
      values: ['text', 'image', 'file', 'system'],
      message: 'Message type must be one of: text, image, file, system'
    },
    default: 'text'
  },
  fileUrl: {
    type: String,
    trim: true
  },
  fileName: {
    type: String,
    trim: true
  },
  fileSize: {
    type: Number
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const chatSchema = new Schema<IChat>({
  // Chat identification
  chatId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Chat type and participants
  type: {
    type: String,
    enum: {
      values: ['direct', 'group', 'class', 'announcement'],
      message: 'Chat type must be one of: direct, group, class, announcement'
    },
    required: true
  },
  
  participants: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'moderator', 'member'],
        message: 'Participant role must be one of: admin, moderator, member'
      },
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastSeen: {
      type: Date,
      default: Date.now
    },
    unreadCount: {
      type: Number,
      default: 0
    }
  }],
  
  // Group/Class specific
  name: {
    type: String,
    trim: true,
    maxlength: [100, 'Chat name cannot be longer than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Chat description cannot be longer than 500 characters']
  },
  avatar: {
    type: String,
    trim: true
  },
  
  // Associated subject (for class chats)
  subject: {
    type: Schema.Types.ObjectId,
    ref: 'Subject'
  },
  
  // Chat settings
  settings: {
    allowFileSharing: {
      type: Boolean,
      default: true
    },
    maxFileSize: {
      type: Number,
      default: 10485760 // 10MB
    },
    allowedFileTypes: [{
      type: String
    }],
    muteNotifications: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: false
    }
  },
  
  // Messages
  messages: [messageSchema],
  
  // Last activity
  lastMessage: {
    content: { type: String },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      default: 'text'
    }
  },
  
  // Chat status
  isActive: {
    type: Boolean,
    default: true
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  
  // Created by
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for better performance (chatId already has unique index from schema)
chatSchema.index({ type: 1 });
chatSchema.index({ 'participants.user': 1 });
chatSchema.index({ subject: 1 });
chatSchema.index({ 'lastMessage.timestamp': -1 });
chatSchema.index({ createdAt: -1 });

// Virtual for total message count
chatSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Method to add participant
chatSchema.methods.addParticipant = function(userId: mongoose.Types.ObjectId, role = 'member') {
  const existingParticipant = this.participants.find(
    (p: any) => p.user.toString() === userId.toString()
  );
  
  if (existingParticipant) {
    throw new Error('User is already a participant');
  }
  
  this.participants.push({
    user: userId,
    role: role,
    joinedAt: new Date(),
    lastSeen: new Date(),
    unreadCount: 0
  });
  
  return this.save();
};

// Method to remove participant
chatSchema.methods.removeParticipant = function(userId: mongoose.Types.ObjectId) {
  this.participants = this.participants.filter(
    (p: any) => p.user.toString() !== userId.toString()
  );
  
  return this.save();
};

// Method to update participant role
chatSchema.methods.updateParticipantRole = function(userId: mongoose.Types.ObjectId, newRole: string) {
  const participant = this.participants.find(
    (p: any) => p.user.toString() === userId.toString()
  );
  
  if (!participant) {
    throw new Error('User is not a participant');
  }
  
  participant.role = newRole;
  return this.save();
};

// Method to add message
chatSchema.methods.addMessage = function(senderId: mongoose.Types.ObjectId, messageData: any) {
  const message = {
    content: messageData.content,
    type: messageData.type || 'text',
    fileUrl: messageData.fileUrl,
    fileName: messageData.fileName,
    fileSize: messageData.fileSize,
    timestamp: new Date()
  };
  
  this.messages.push(message);
  
  // Update last message
  this.lastMessage = {
    content: messageData.content,
    sender: senderId,
    timestamp: message.timestamp,
    type: message.type
  };
  
  // Update unread count for other participants
  this.participants.forEach((participant: any) => {
    if (participant.user.toString() !== senderId.toString()) {
      participant.unreadCount += 1;
    }
  });
  
  return this.save();
};

// Method to mark messages as read
chatSchema.methods.markAsRead = function(userId: mongoose.Types.ObjectId) {
  const participant = this.participants.find(
    (p: any) => p.user.toString() === userId.toString()
  );
  
  if (participant) {
    participant.unreadCount = 0;
    participant.lastSeen = new Date();
    return this.save();
  }
  
  throw new Error('User is not a participant');
};

// Method to get unread count for user
chatSchema.methods.getUnreadCount = function(userId: mongoose.Types.ObjectId) {
  const participant = this.participants.find(
    (p: any) => p.user.toString() === userId.toString()
  );
  
  return participant ? participant.unreadCount : 0;
};

// Static method to find chats by user
chatSchema.statics.findByUser = function(userId: mongoose.Types.ObjectId, options: any = {}) {
  const query: any = {
    'participants.user': userId,
    isActive: true
  };
  
  if (options.type) {
    query.type = options.type;
  }
  
  if (options.includeArchived !== true) {
    query.isArchived = false;
  }
  
  return this.find(query)
    .populate('participants.user', 'firstName lastName avatar')
    .populate('lastMessage.sender', 'firstName lastName')
    .populate('subject', 'name code')
    .sort({ 'lastMessage.timestamp': -1 })
    .limit(options.limit || 50);
};

// Static method to create direct chat
chatSchema.statics.createDirectChat = async function(user1Id: mongoose.Types.ObjectId, user2Id: mongoose.Types.ObjectId) {
  // Check if direct chat already exists
  const existingChat = await this.findOne({
    type: 'direct',
    'participants.user': { $all: [user1Id, user2Id] },
    isActive: true
  });
  
  if (existingChat) {
    return existingChat;
  }
  
  // Generate unique chat ID
  const id1 = user1Id.toString();
  const id2 = user2Id.toString();
  const chatId = `direct_${id1 < id2 ? id1 : id2}_${id1 < id2 ? id2 : id1}`;
  
  const chat = new this({
    chatId,
    type: 'direct',
    participants: [
      { user: user1Id, role: 'member' },
      { user: user2Id, role: 'member' }
    ],
    createdBy: user1Id
  });
  
  return chat.save();
};

// Static method to create group/class chat
chatSchema.statics.createGroupChat = function(creatorId: mongoose.Types.ObjectId, chatData: any) {
  const chatId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const chat = new this({
    chatId,
    type: chatData.type || 'group',
    name: chatData.name,
    description: chatData.description,
    subject: chatData.subject,
    participants: [
      { user: creatorId, role: 'admin' },
      ...(chatData.participants || []).map((userId: mongoose.Types.ObjectId) => ({
        user: userId,
        role: 'member'
      }))
    ],
    settings: chatData.settings || {},
    createdBy: creatorId
  });
  
  return chat.save();
};

export const Chat = mongoose.models.Chat || mongoose.model<IChat>('Chat', chatSchema);
