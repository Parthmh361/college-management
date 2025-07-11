'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Calendar, 
  BookOpen,
  BarChart3,
  MessageSquare,
  CheckCircle,
  XCircle,
  TrendingUp
} from 'lucide-react';

interface ParentStats {
  childrenCount: number;
  totalClasses: number;
  attendedClasses: number;
  averageAttendance: number;
  upcomingEvents: number;
}

export default function ParentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<ParentStats | null>(null);
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
    
    // Check if user is parent
    if (parsedUser.role !== 'Parent') {
      router.push('/dashboard');
      return;
    }

    setUser(parsedUser);
    fetchParentStats();
  }, [router]);

  const fetchParentStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch parent statistics
      const response = await fetch('/api/analytics?type=parent', {
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
          childrenCount: 2,
          totalClasses: 240,
          attendedClasses: 220,
          averageAttendance: 91.7,
          upcomingEvents: 3
        });
      }
    } catch (error) {
      console.error('Error fetching parent stats:', error);
      // Mock data for now
      setStats({
        childrenCount: 2,
        totalClasses: 240,
        attendedClasses: 220,
        averageAttendance: 91.7,
        upcomingEvents: 3
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
          <p className="mt-4 text-gray-600">Loading parent dashboard...</p>
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
              Parent Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {user.firstName} {user.lastName}! Here's your children's progress.
            </p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={() => router.push('/parent/attendance')}>
              <Calendar className="mr-2 h-4 w-4" />
              View Attendance
            </Button>
            <Button variant="outline" onClick={() => router.push('/chat')}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Contact Teachers
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Children</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.childrenCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                Students registered
              </p>
            </CardContent>
          </Card>

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
              <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.averageAttendance || 0}%</div>
              <p className="text-xs text-muted-foreground">
                Overall performance
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Children Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Children's Performance</CardTitle>
            <CardDescription>
              Attendance overview for each child
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { 
                  name: 'Alex Johnson', 
                  grade: 'Grade 10', 
                  attendance: 92.5, 
                  totalClasses: 120, 
                  attendedClasses: 111,
                  status: 'excellent'
                },
                { 
                  name: 'Emma Johnson', 
                  grade: 'Grade 8', 
                  attendance: 89.2, 
                  totalClasses: 120, 
                  attendedClasses: 107,
                  status: 'good'
                },
              ].map((child, index) => (
                <div key={index} className="flex items-center justify-between py-4 px-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{child.name}</p>
                      <p className="text-xs text-gray-500">
                        {child.grade} • {child.attendedClasses}/{child.totalClasses} classes
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{child.attendance}%</div>
                    <Badge variant={child.status === 'excellent' ? 'default' : 'secondary'}>
                      {child.status === 'excellent' ? 'Excellent' : 'Good'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>
              Latest updates about your children
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { 
                  child: 'Alex Johnson', 
                  activity: 'Marked present for Mathematics', 
                  time: '2 hours ago', 
                  type: 'attendance' 
                },
                { 
                  child: 'Emma Johnson', 
                  activity: 'Assignment submitted for Science', 
                  time: '4 hours ago', 
                  type: 'assignment' 
                },
                { 
                  child: 'Alex Johnson', 
                  activity: 'Parent-teacher meeting scheduled', 
                  time: '1 day ago', 
                  type: 'meeting' 
                },
                { 
                  child: 'Emma Johnson', 
                  activity: 'Marked present for English', 
                  time: '1 day ago', 
                  type: 'attendance' 
                },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'attendance' ? 'bg-green-500' :
                      activity.type === 'assignment' ? 'bg-blue-500' :
                      'bg-purple-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium">{activity.activity}</p>
                      <p className="text-xs text-gray-500">{activity.child}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => router.push('/parent/attendance')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Attendance Reports
              </CardTitle>
              <CardDescription>
                View detailed attendance reports
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push('/parent/progress')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="mr-2 h-5 w-5" />
                Progress Reports
              </CardTitle>
              <CardDescription>
                Academic performance insights
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push('/chat')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                Teacher Communication
              </CardTitle>
              <CardDescription>
                Chat with teachers and staff
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
