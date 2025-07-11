'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  QrCode, 
  BookOpen,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface TeacherStats {
  totalClasses: number;
  studentsPresent: number;
  todaysClasses: number;
  attendanceRate: number;
  totalStudents: number;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<TeacherStats | null>(null);
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
    
    // Check if user is teacher
    if (parsedUser.role !== 'Teacher') {
      router.push('/dashboard');
      return;
    }

    setUser(parsedUser);
    fetchTeacherStats();
  }, [router]);

  const fetchTeacherStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch teacher statistics
      const response = await fetch('/api/analytics?type=teacher', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.analytics);
      } else {
        // Mock data for now
        setStats({
          totalClasses: 8,
          studentsPresent: 28,
          todaysClasses: 3,
          attendanceRate: 85.2,
          totalStudents: 35
        });
      }
    } catch (error) {
      console.error('Error fetching teacher stats:', error);
      // Mock data for now
      setStats({
        totalClasses: 8,
        studentsPresent: 28,
        todaysClasses: 3,
        attendanceRate: 85.2,
        totalStudents: 35
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading teacher dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Teacher Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {user.firstName} {user.lastName}! Ready to take attendance?
            </p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={() => router.push('/teacher/qr-codes')}>
              <QrCode className="mr-2 h-4 w-4" />
              Generate QR
            </Button>
            <Button variant="outline" onClick={() => router.push('/attendance')}>
              <Calendar className="mr-2 h-4 w-4" />
              Attendance
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalClasses || 0}</div>
              <p className="text-xs text-muted-foreground">
                This semester
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students Present</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.studentsPresent || 0}</div>
              <p className="text-xs text-muted-foreground">
                Out of {stats?.totalStudents || 0} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.todaysClasses || 0}</div>
              <p className="text-xs text-muted-foreground">
                Scheduled for today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.attendanceRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                Average this month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => router.push('/teacher/qr-codes')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="mr-2 h-5 w-5" />
                Generate QR Code
              </CardTitle>
              <CardDescription>
                Create QR codes for attendance tracking
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push('/teacher/students')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                View Students
              </CardTitle>
              <CardDescription>
                Manage and view your students
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push('/teacher/analytics')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                View Analytics
              </CardTitle>
              <CardDescription>
                Attendance reports and insights
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>
              Your classes for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { time: '09:00 AM', subject: 'Mathematics', room: 'Room 101', status: 'completed' },
                { time: '11:00 AM', subject: 'Physics', room: 'Lab 2', status: 'in-progress' },
                { time: '02:00 PM', subject: 'Chemistry', room: 'Lab 1', status: 'upcoming' },
                { time: '04:00 PM', subject: 'Advanced Math', room: 'Room 205', status: 'upcoming' },
              ].map((class_, index) => (
                <div key={index} className="flex items-center justify-between py-3 px-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm font-medium text-gray-900">{class_.time}</div>
                    <div>
                      <p className="text-sm font-medium">{class_.subject}</p>
                      <p className="text-xs text-gray-500">{class_.room}</p>
                    </div>
                  </div>
                  <Badge variant={
                    class_.status === 'completed' ? 'default' :
                    class_.status === 'in-progress' ? 'destructive' : 'secondary'
                  }>
                    {class_.status === 'completed' ? 'Completed' :
                     class_.status === 'in-progress' ? 'In Progress' : 'Upcoming'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
