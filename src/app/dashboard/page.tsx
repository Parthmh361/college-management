'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';

interface DashboardStats {
  totalClasses: number;
  presentClasses: number;
  absentClasses: number;
  lateClasses: number;
  attendanceRate: number;
}

interface RecentActivity {
  id: string;
  type: string;
  message: string;
  time: string;
  status: 'success' | 'warning' | 'error';
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
      fetchDashboardData();
    }
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch attendance stats
      const statsResponse = await fetch('/api/analytics?type=overview&period=30', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.analytics);
      }

      // Mock recent activity data
      setRecentActivity([
        {
          id: '1',
          type: 'attendance',
          message: 'Marked present for Mathematics class',
          time: '2 hours ago',
          status: 'success'
        },
        {
          id: '2',
          type: 'notification',
          message: 'New assignment uploaded for Physics',
          time: '4 hours ago',
          status: 'warning'
        },
        {
          id: '3',
          type: 'attendance',
          message: 'Marked late for Chemistry class',
          time: '1 day ago',
          status: 'warning'
        }
      ]);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {getGreeting()}, {user.firstName} {user.lastName}!
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome back to your dashboard
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {user.role}
          </Badge>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalClasses}</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Present</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.presentClasses}</div>
                <p className="text-xs text-muted-foreground">
                  Classes attended
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Absent</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.absentClasses}</div>
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
                <div className={`text-2xl font-bold ${getAttendanceColor(stats.attendanceRate)}`}>
                  {stats.attendanceRate}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Overall performance
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest actions and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3">
                    {getStatusIcon(activity.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {user.role === 'Student' && (
                  <>
                    <Button variant="outline" className="h-20 flex flex-col">
                      <Calendar className="h-6 w-6 mb-2" />
                      View Schedule
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col">
                      <BarChart3 className="h-6 w-6 mb-2" />
                      My Progress
                    </Button>
                  </>
                )}
                
                {user.role === 'Teacher' && (
                  <>
                    <Button variant="outline" className="h-20 flex flex-col">
                      <Users className="h-6 w-6 mb-2" />
                      Manage Students
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col">
                      <BarChart3 className="h-6 w-6 mb-2" />
                      View Analytics
                    </Button>
                  </>
                )}

                {user.role === 'Admin' && (
                  <>
                    <Button variant="outline" className="h-20 flex flex-col">
                      <Users className="h-6 w-6 mb-2" />
                      Manage Users
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col">
                      <BarChart3 className="h-6 w-6 mb-2" />
                      System Analytics
                    </Button>
                  </>
                )}

                {user.role === 'Parent' && (
                  <>
                    <Button variant="outline" className="h-20 flex flex-col">
                      <Calendar className="h-6 w-6 mb-2" />
                      Child's Schedule
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col">
                      <BarChart3 className="h-6 w-6 mb-2" />
                      Progress Report
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
