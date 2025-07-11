'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  QrCode, 
  BookOpen,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp
} from 'lucide-react';

interface StudentStats {
  totalClasses: number;
  attendedClasses: number;
  missedClasses: number;
  attendanceRate: number;
  todaysClasses: number;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
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
    
    // Check if user is student
    if (parsedUser.role !== 'Student') {
      router.push('/dashboard');
      return;
    }

    setUser(parsedUser);
    fetchStudentStats();
  }, [router]);

  const fetchStudentStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch student statistics
      const response = await fetch('/api/analytics?type=student', {
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
          totalClasses: 120,
          attendedClasses: 105,
          missedClasses: 15,
          attendanceRate: 87.5,
          todaysClasses: 4
        });
      }
    } catch (error) {
      console.error('Error fetching student stats:', error);
      // Mock data for now
      setStats({
        totalClasses: 120,
        attendedClasses: 105,
        missedClasses: 15,
        attendanceRate: 87.5,
        todaysClasses: 4
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
          <p className="mt-4 text-gray-600">Loading student dashboard...</p>
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
              Student Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {user.firstName} {user.lastName}! Here's your attendance overview.
            </p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={() => router.push('/student/scan')}>
              <QrCode className="mr-2 h-4 w-4" />
              Scan QR
            </Button>
            <Button variant="outline" onClick={() => router.push('/attendance')}>
              <Calendar className="mr-2 h-4 w-4" />
              My Attendance
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
              <CardTitle className="text-sm font-medium">Attended</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.attendedClasses || 0}</div>
              <p className="text-xs text-muted-foreground">
                Classes attended
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Missed</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.missedClasses || 0}</div>
              <p className="text-xs text-muted-foreground">
                Classes missed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.attendanceRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                Overall percentage
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Status */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Status</CardTitle>
            <CardDescription>
              Your attendance performance by subject
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { subject: 'Mathematics', attended: 25, total: 28, rate: 89.3 },
                { subject: 'Physics', attended: 22, total: 26, rate: 84.6 },
                { subject: 'Chemistry', attended: 30, total: 32, rate: 93.8 },
                { subject: 'Computer Science', attended: 28, total: 30, rate: 93.3 },
              ].map((subject, index) => (
                <div key={index} className="flex items-center justify-between py-3 px-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <BookOpen className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">{subject.subject}</p>
                      <p className="text-xs text-gray-500">
                        {subject.attended}/{subject.total} classes
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{subject.rate}%</div>
                    <Badge variant={subject.rate >= 90 ? 'default' : subject.rate >= 75 ? 'secondary' : 'destructive'}>
                      {subject.rate >= 90 ? 'Excellent' : subject.rate >= 75 ? 'Good' : 'Low'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
                { time: '09:00 AM', subject: 'Mathematics', room: 'Room 101', teacher: 'Dr. Smith', status: 'completed' },
                { time: '11:00 AM', subject: 'Physics', room: 'Lab 2', teacher: 'Prof. Johnson', status: 'in-progress' },
                { time: '02:00 PM', subject: 'Chemistry', room: 'Lab 1', teacher: 'Dr. Brown', status: 'upcoming' },
                { time: '04:00 PM', subject: 'Computer Science', room: 'Room 205', teacher: 'Prof. Davis', status: 'upcoming' },
              ].map((class_, index) => (
                <div key={index} className="flex items-center justify-between py-3 px-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">{class_.subject}</p>
                      <p className="text-xs text-gray-500">
                        {class_.time} • {class_.room} • {class_.teacher}
                      </p>
                    </div>
                  </div>
                  <Badge variant={
                    class_.status === 'completed' ? 'default' :
                    class_.status === 'in-progress' ? 'destructive' : 'secondary'
                  }>
                    {class_.status === 'completed' ? 'Attended' :
                     class_.status === 'in-progress' ? 'In Progress' : 'Upcoming'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => router.push('/student/scan')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="mr-2 h-5 w-5" />
                Scan QR Code
              </CardTitle>
              <CardDescription>
                Scan QR code to mark attendance
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push('/student/progress')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                View Progress
              </CardTitle>
              <CardDescription>
                Detailed attendance analytics
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push('/attendance')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Attendance History
              </CardTitle>
              <CardDescription>
                View your complete attendance record
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
