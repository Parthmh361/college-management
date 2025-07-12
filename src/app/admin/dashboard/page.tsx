'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  BookOpen,
  BarChart3,
  UserPlus,
  Settings,
  Activity,
  GraduationCap,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  Target,
  PieChart,
  Database,
  Shield
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalSubjects: number;
  totalAttendanceToday: number;
  attendanceRate: number;
  activeQRCodes: number;
  recentRegistrations: number;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

interface RecentActivity {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  type: 'success' | 'warning' | 'info';
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userData || !token) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    
    // Check if user is admin
    if (parsedUser.role !== 'Admin') {
      router.push('/dashboard');
      return;
    }

    setUser(parsedUser);
    fetchAdminStats();
    fetchRecentActivities();
  }, [router]);

  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch admin statistics
      const response = await fetch('/api/analytics?type=admin', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.analytics);
      } else {
        // Mock data for demo
        setStats({
          totalUsers: 156,
          totalStudents: 128,
          totalTeachers: 24,
          totalSubjects: 18,
          totalAttendanceToday: 98,
          attendanceRate: 89.5,
          activeQRCodes: 5,
          recentRegistrations: 12
        });
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      // Mock data for demo
      setStats({
        totalUsers: 156,
        totalStudents: 128,
        totalTeachers: 24,
        totalSubjects: 18,
        totalAttendanceToday: 98,
        attendanceRate: 89.5,
        activeQRCodes: 5,
        recentRegistrations: 12
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivities = async () => {
    // Mock recent activities for demo
    setRecentActivities([
      {
        id: '1',
        action: 'New student registered',
        user: 'John Doe',
        timestamp: '2 minutes ago',
        type: 'success'
      },
      {
        id: '2',
        action: 'QR Code generated for Math 101',
        user: 'Prof. Smith',
        timestamp: '15 minutes ago',
        type: 'info'
      },
      {
        id: '3',
        action: 'Low attendance in Physics',
        user: 'System Alert',
        timestamp: '1 hour ago',
        type: 'warning'
      },
      {
        id: '4',
        action: 'New subject created',
        user: 'Admin',
        timestamp: '2 hours ago',
        type: 'success'
      }
    ]);
  };

  const quickActions: QuickAction[] = [
    {
      title: 'User Management',
      description: 'Manage students, teachers, and staff',
      icon: <Users className="h-6 w-6" />,
      href: '/admin/users-management',
      color: 'bg-blue-500'
    },
    {
      title: 'Analytics & Reports',
      description: 'View comprehensive analytics',
      icon: <BarChart3 className="h-6 w-6" />,
      href: '/admin/analytics',
      color: 'bg-green-500'
    },
    {
      title: 'Subject Management',
      description: 'Create and manage subjects',
      icon: <BookOpen className="h-6 w-6" />,
      href: '/admin/subjects',
      color: 'bg-purple-500'
    },
    {
      title: 'Attendance Overview',
      description: 'Monitor attendance patterns',
      icon: <UserCheck className="h-6 w-6" />,
      href: '/admin/attendance',
      color: 'bg-orange-500'
    },
    {
      title: 'System Settings',
      description: 'Configure system settings',
      icon: <Settings className="h-6 w-6" />,
      href: '/admin/settings',
      color: 'bg-gray-500'
    },
    {
      title: 'Bulk Operations',
      description: 'Perform bulk operations',
      icon: <Database className="h-6 w-6" />,
      href: '/admin/bulk-operations',
      color: 'bg-red-500'
    }
  ];

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading admin dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.firstName}! Here's what's happening at your institution.
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        {/* Key Statistics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{stats?.recentRegistrations || 0} new this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.totalTeachers || 0} teachers active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.attendanceRate || 0}%</div>
              <Progress value={stats?.attendanceRate || 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active QR Codes</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeQRCodes || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.totalSubjects || 0} subjects total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                    <div className={`p-2 rounded-lg ${action.color} text-white mr-4`}>
                      {action.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                      <CardDescription>{action.description}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activities and System Health */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3">
                    <div className={`p-1 rounded-full ${
                      activity.type === 'success' ? 'bg-green-100' :
                      activity.type === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                    }`}>
                      {activity.type === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : activity.type === 'warning' ? (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      ) : (
                        <Activity className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.user} • {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button variant="outline" size="sm" className="w-full">
                  View All Activities
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                System Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Database Health</span>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Healthy
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Active Sessions</span>
                  <Badge variant="outline">
                    {stats?.totalUsers ? Math.floor(stats.totalUsers * 0.3) : 0}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Storage Usage</span>
                  <div className="flex items-center space-x-2">
                    <Progress value={72} className="w-20" />
                    <span className="text-sm text-muted-foreground">72%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Last Backup</span>
                  <span className="text-sm text-muted-foreground">2 hours ago</span>
                </div>
              </div>
              <div className="mt-4">
                <Link href="/admin/settings">
                  <Button variant="outline" size="sm" className="w-full">
                    System Settings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
