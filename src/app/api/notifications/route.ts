import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Notification } from '@/models/Notification';
import { User } from '@/models/User';
import { verifyToken } from '@/lib/auth';
import { requireRole } from '@/lib/middleware';

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
    const type = searchParams.get('type');
    const isRead = searchParams.get('isRead');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');

    // Build query
    const query: any = { recipient: decoded.userId };
    
    if (type) {
      query.type = type;
    }
    
    if (isRead !== null) {
      query.isRead = isRead === 'true';
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const totalCount = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipient: decoded.userId,
      isRead: false
    });

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount
      },
      unreadCount
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
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

    // Get user to check role
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has permission to send notifications
    const roleCheck = requireRole(['Admin', 'Teacher'])({ ...decoded, role: user.role });
    if (!roleCheck.success) {
      return NextResponse.json({ error: roleCheck.error }, { status: 403 });
    }

    const { 
      recipientIds, 
      title, 
      message, 
      type = 'general',
      priority = 'medium',
      metadata 
    } = await request.json();

    if (!recipientIds || !Array.isArray(recipientIds) || !title || !message) {
      return NextResponse.json(
        { error: 'Recipient IDs, title, and message are required' },
        { status: 400 }
      );
    }

    // Verify recipients exist
    const recipients = await User.find({ _id: { $in: recipientIds } });
    if (recipients.length !== recipientIds.length) {
      return NextResponse.json(
        { error: 'Some recipients not found' },
        { status: 400 }
      );
    }

    // Create notifications for each recipient
    const notifications = recipientIds.map(recipientId => ({
      sender: decoded.userId,
      recipient: recipientId,
      title,
      message,
      type,
      priority,
      metadata: metadata || {},
      isRead: false
    }));

    const createdNotifications = await Notification.insertMany(notifications);

    return NextResponse.json({
      message: 'Notifications sent successfully',
      count: createdNotifications.length,
      notifications: createdNotifications
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating notifications:', error);
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

    const { notificationIds, action } = await request.json();

    if (!notificationIds || !Array.isArray(notificationIds) || !action) {
      return NextResponse.json(
        { error: 'Notification IDs and action are required' },
        { status: 400 }
      );
    }

    let updateData: any = {};
    
    if (action === 'markAsRead') {
      updateData = { isRead: true, readAt: new Date() };
    } else if (action === 'markAsUnread') {
      updateData = { isRead: false, readAt: null };
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "markAsRead" or "markAsUnread"' },
        { status: 400 }
      );
    }

    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds },
        recipient: decoded.userId
      },
      updateData
    );

    return NextResponse.json({
      message: `Notifications ${action === 'markAsRead' ? 'marked as read' : 'marked as unread'}`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const { notificationIds } = await request.json();

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'Notification IDs are required' },
        { status: 400 }
      );
    }

    const result = await Notification.deleteMany({
      _id: { $in: notificationIds },
      recipient: decoded.userId
    });

    return NextResponse.json({
      message: 'Notifications deleted successfully',
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
