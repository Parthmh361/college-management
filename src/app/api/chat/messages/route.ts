import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Chat } from '@/models/Chat';
import { verifyToken } from '@/lib/auth';
import { User } from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const receiverId = searchParams.get('receiverId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    if (!receiverId) {
      return NextResponse.json({ error: 'Receiver ID is required' }, { status: 400 });
    }

    // Find messages between the current user and the receiver
    const messages = await Chat.find({
      $or: [
        { sender: decoded.userId, receiver: receiverId },
        { sender: receiverId, receiver: decoded.userId }
      ]
    })
    .populate('sender', 'name email role')
    .populate('receiver', 'name email role')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);

    // Mark messages as read for the current user
    await Chat.updateMany(
      {
        sender: receiverId,
        receiver: decoded.userId,
        isRead: false
      },
      { isRead: true, readAt: new Date() }
    );

    return NextResponse.json({
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        hasMore: messages.length === limit
      }
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { receiverId, content, messageType = 'text' } = await request.json();

    if (!receiverId || !content) {
      return NextResponse.json(
        { error: 'Receiver ID and content are required' },
        { status: 400 }
      );
    }

    // Verify receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return NextResponse.json({ error: 'Receiver not found' }, { status: 404 });
    }

    // Create new message
    const message = new Chat({
      sender: decoded.userId,
      receiver: receiverId,
      content,
      messageType,
      isRead: false
    });

    await message.save();
    
    // Populate sender and receiver details
    await message.populate('sender', 'name email role');
    await message.populate('receiver', 'name email role');

    return NextResponse.json({ message }, { status: 201 });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { messageIds } = await request.json();

    if (!messageIds || !Array.isArray(messageIds)) {
      return NextResponse.json(
        { error: 'Message IDs array is required' },
        { status: 400 }
      );
    }

    // Mark messages as read (only messages received by the current user)
    const result = await Chat.updateMany(
      {
        _id: { $in: messageIds },
        receiver: decoded.userId,
        isRead: false
      },
      { isRead: true, readAt: new Date() }
    );

    return NextResponse.json({
      message: 'Messages marked as read',
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
