import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Chat } from '@/models/Chat';
import { User } from '@/models/User';
import { verifyToken } from '@/lib/auth';

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

    // Get all users that the current user has chatted with
    const chats = await Chat.aggregate([
      {
        $match: {
          $or: [
            { sender: decoded.userId },
            { receiver: decoded.userId }
          ]
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', decoded.userId] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $last: '$content' },
          lastMessageTime: { $last: '$createdAt' },
          lastMessageType: { $last: '$messageType' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', decoded.userId] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      }
    ]);

    // Get user details for each contact
    const contactIds = chats.map(chat => chat._id);
    const users = await User.find(
      { _id: { $in: contactIds } },
      'name email role avatar isOnline lastSeen'
    );

    // Combine chat data with user data
    const contacts = chats.map(chat => {
      const user = users.find(u => u._id.toString() === chat._id.toString());
      return {
        user,
        lastMessage: chat.lastMessage,
        lastMessageTime: chat.lastMessageTime,
        lastMessageType: chat.lastMessageType,
        unreadCount: chat.unreadCount
      };
    }).filter(contact => contact.user); // Filter out any contacts where user wasn't found

    return NextResponse.json({ contacts });

  } catch (error) {
    console.error('Error fetching chat contacts:', error);
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

    const { searchQuery, role } = await request.json();

    // Build search criteria
    const searchCriteria: any = {
      _id: { $ne: decoded.userId } // Exclude current user
    };

    if (searchQuery) {
      searchCriteria.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    if (role && role !== 'all') {
      searchCriteria.role = role;
    }

    const users = await User.find(
      searchCriteria,
      'name email role avatar isOnline lastSeen'
    ).limit(20);

    return NextResponse.json({ users });

  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
