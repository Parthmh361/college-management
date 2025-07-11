import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Socket } from 'socket.io';
import { verifyToken } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import { User } from '@/models/User';
import { Chat } from '@/models/Chat';

export interface SocketWithAuth extends Socket {
  userId?: string;
  userRole?: string;
}

let io: SocketIOServer;
const connectedUsers = new Map<string, string>(); // userId -> socketId

export function initializeSocket(httpServer: HTTPServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.use(async (socket: any, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = verifyToken(token);
      if (!decoded) {
        return next(new Error('Invalid token'));
      }

      await connectToDatabase();
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.userId = decoded.userId;
      socket.userRole = user.role;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket: any) => {
    console.log(`User ${socket.userId} connected`);
    
    // Store user connection
    connectedUsers.set(socket.userId, socket.id);
    
    // Update user online status
    await User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      lastSeen: new Date()
    });

    // Join user to their personal room for notifications
    socket.join(`user:${socket.userId}`);

    // Handle chat events
    socket.on('join-chat', (data: { receiverId: string }) => {
      const chatRoom = getChatRoomId(socket.userId, data.receiverId);
      socket.join(chatRoom);
    });

    socket.on('leave-chat', (data: { receiverId: string }) => {
      const chatRoom = getChatRoomId(socket.userId, data.receiverId);
      socket.leave(chatRoom);
    });

    socket.on('send-message', async (data: {
      receiverId: string;
      content: string;
      messageType?: string;
    }) => {
      try {
        const message = new Chat({
          sender: socket.userId,
          receiver: data.receiverId,
          content: data.content,
          messageType: data.messageType || 'text',
          isRead: false
        });

        await message.save();
        await message.populate('sender', 'name email role');
        await message.populate('receiver', 'name email role');

        const chatRoom = getChatRoomId(socket.userId, data.receiverId);
        
        // Send to chat room
        io.to(chatRoom).emit('new-message', message);
        
        // Send notification to receiver if they're online but not in the chat room
        const receiverSocketId = connectedUsers.get(data.receiverId);
        if (receiverSocketId) {
          const receiverSocket = io.sockets.sockets.get(receiverSocketId);
          if (receiverSocket && !receiverSocket.rooms.has(chatRoom)) {
            receiverSocket.emit('message-notification', {
              senderId: socket.userId,
              senderName: message.sender.name,
              content: data.content,
              messageType: data.messageType
            });
          }
        }
      } catch (error) {
        socket.emit('message-error', { error: 'Failed to send message' });
      }
    });

    socket.on('typing-start', (data: { receiverId: string }) => {
      const chatRoom = getChatRoomId(socket.userId, data.receiverId);
      socket.to(chatRoom).emit('user-typing', {
        userId: socket.userId,
        isTyping: true
      });
    });

    socket.on('typing-stop', (data: { receiverId: string }) => {
      const chatRoom = getChatRoomId(socket.userId, data.receiverId);
      socket.to(chatRoom).emit('user-typing', {
        userId: socket.userId,
        isTyping: false
      });
    });

    // Handle attendance events
    socket.on('join-attendance-session', (data: { qrCodeId: string }) => {
      if (socket.userRole === 'Teacher' || socket.userRole === 'Admin') {
        socket.join(`attendance:${data.qrCodeId}`);
      }
    });

    socket.on('leave-attendance-session', (data: { qrCodeId: string }) => {
      socket.leave(`attendance:${data.qrCodeId}`);
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User ${socket.userId} disconnected`);
      
      // Remove from connected users
      connectedUsers.delete(socket.userId);
      
      // Update user offline status
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date()
      });
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

// Helper function to create consistent chat room IDs
function getChatRoomId(userId1: string, userId2: string): string {
  return `chat:${[userId1, userId2].sort().join(':')}`;
}

// Utility functions for emitting events
export async function sendNotificationToUser(userId: string, notification: any) {
  if (io) {
    io.to(`user:${userId}`).emit('new-notification', notification);
  }
}

export async function sendAttendanceUpdate(qrCodeId: string, attendanceData: any) {
  if (io) {
    io.to(`attendance:${qrCodeId}`).emit('attendance-marked', attendanceData);
  }
}

export async function broadcastSystemNotification(message: string, type: string = 'info') {
  if (io) {
    io.emit('system-notification', { message, type, timestamp: new Date() });
  }
}

export async function sendQRCodeExpired(qrCodeId: string) {
  if (io) {
    io.to(`attendance:${qrCodeId}`).emit('qr-code-expired', { qrCodeId });
  }
}
