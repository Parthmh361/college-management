'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  User,
  LogOut,
  Settings,
  Home,
  Calendar,
  Users,
  MessageSquare,
  BarChart3,
  QrCode,
  BookOpen,
  Clock,
  GraduationCap,
  Menu
} from 'lucide-react';
import Sidebar from './Sidebar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: User | null; // Make optional for backward compatibility
}

export default function DashboardLayout({ children, user: propUser }: DashboardLayoutProps) {
  const router = useRouter();
  const { user: storeUser, token, isAuthenticated, setUser, setToken, logout } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  // Use store user or prop user for backward compatibility, ensuring correct type
  function isValidUser(obj: any): obj is User {
    return (
      obj &&
      typeof obj === 'object' &&
      typeof obj.id === 'string' &&
      typeof obj.firstName === 'string' &&
      typeof obj.lastName === 'string' &&
      typeof obj.email === 'string' &&
      typeof obj.role === 'string'
    );
  }

  const user: User | null | undefined =
    (isValidUser(storeUser) ? storeUser : null) ||
    (isValidUser(propUser) ? propUser : null);

  useEffect(() => {
    // If already authenticated or propUser is present, stop loading
    if (isAuthenticated || propUser) {
      setLoadingUser(false);
      return;
    }

    // Try to get user from localStorage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        setLoadingUser(false);
      } catch {
        logout();
        router.replace('/login');
        setLoadingUser(false);
      }
    } else {
      router.replace('/login');
      setLoadingUser(false);
    }
  }, [isAuthenticated, propUser, setToken, setUser, logout, router]);

  // 1. Define fetchNotifications FIRST
  const fetchNotifications = async () => {
    try {
      const authToken = token || localStorage.getItem('token');
      const response = await fetch('/api/notifications?limit=5', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // 2. THEN use it in useEffect
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Don't render anything if user is not provided to prevent hydration errors
  if (loadingUser) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p>Loading...</p>
      </div>
    </div>;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getNavigationItems = (user: User | null | undefined) => {
    if (!user) return [];

    const baseItems = [
      { icon: Home, label: 'Dashboard', href: '/dashboard' },
      { icon: Clock, label: 'Timetable', href: '/timetable' },
      { icon: Calendar, label: 'Attendance', href: '/attendance' },
      { icon: MessageSquare, label: 'Chat', href: '/chat' },
    ];

    if (user.role === 'Admin') {
      return [
        ...baseItems,
        { icon: Users, label: 'Users Management', href: '/admin/users-management' },
        { icon: BookOpen, label: 'Subjects', href: '/admin/subjects' },
        { icon: Clock, label: 'Timetable Admin', href: '/admin/timetable' },
        { icon: GraduationCap, label: 'Academic Management', href: '/admin/management' },
        { icon: BarChart3, label: 'Analytics', href: '/admin/analytics' },
        { icon: Settings, label: 'Settings', href: '/admin/settings' },
      ];
    } else if (user.role === 'Teacher') {
      return [
        ...baseItems,
        { icon: QrCode, label: 'QR Codes', href: '/teacher/qr-codes' },
        { icon: Users, label: 'Students', href: '/teacher/students' },
        { icon: BarChart3, label: 'Analytics', href: '/teacher/analytics' },
      ];
    } else if (user.role === 'Student') {
      return [
        ...baseItems,
        { icon: QrCode, label: 'Scan QR', href: '/student/scan' },
        { icon: BarChart3, label: 'My Progress', href: '/student/progress' },
      ];
    } else if (user.role === 'Parent') {
      return [
        { icon: Home, label: 'Dashboard', href: '/parent/dashboard' },
        { icon: Clock, label: 'Timetable', href: '/timetable' },
        { icon: Calendar, label: 'Child Attendance', href: '/parent/attendance' },
        { icon: MessageSquare, label: 'Chat', href: '/chat' },
        { icon: BarChart3, label: 'Progress Report', href: '/parent/progress' },
      ];
    }

    return baseItems;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar for desktop */}
      <div className="hidden md:block">
        <Sidebar user={user} />
      </div>
      {/* Mobile sidebar toggle */}
      <div className="md:hidden fixed top-2 left-2 z-50">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SheetTitle className="sr-only">Sidebar Navigation</SheetTitle>
            <Sidebar user={user} />
          </SheetContent>
        </Sheet>
      </div>
      {/* Main Content */}
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 transition-all duration-200">
        {children}
      </main>
    </div>
  );
}
