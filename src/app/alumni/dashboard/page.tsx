'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  Calendar, 
  Users,
  MessageSquare,
  Briefcase,
  Award,
  Network,
  Heart
} from 'lucide-react';

interface AlumniStats {
  graduationYear: number;
  networkConnections: number;
  eventsAttended: number;
  mentorshipHours: number;
  donationAmount: number;
}

export default function AlumniDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<AlumniStats | null>(null);
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
    
    // Check if user is alumni
    if (parsedUser.role !== 'Alumni') {
      router.push('/dashboard');
      return;
    }

    setUser(parsedUser);
    fetchAlumniStats();
  }, [router]);

  const fetchAlumniStats = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch alumni statistics
      const response = await fetch('/api/analytics?type=alumni', {
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
          graduationYear: 2020,
          networkConnections: 45,
          eventsAttended: 8,
          mentorshipHours: 24,
          donationAmount: 500
        });
      }
    } catch (error) {
      console.error('Error fetching alumni stats:', error);
      // Mock data for now
      setStats({
        graduationYear: 2020,
        networkConnections: 45,
        eventsAttended: 8,
        mentorshipHours: 24,
        donationAmount: 500
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
          <p className="mt-4 text-gray-600">Loading alumni dashboard...</p>
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
              Alumni Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome back, {user.firstName} {user.lastName}! Stay connected with your alma mater.
            </p>
          </div>
          <div className="flex space-x-3">
            <Button onClick={() => router.push('/alumni/events')}>
              <Calendar className="mr-2 h-4 w-4" />
              View Events
            </Button>
            <Button variant="outline" onClick={() => router.push('/alumni/network')}>
              <Network className="mr-2 h-4 w-4" />
              Alumni Network
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Graduated</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.graduationYear || 0}</div>
              <p className="text-xs text-muted-foreground">
                Class of {stats?.graduationYear}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Network</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.networkConnections || 0}</div>
              <p className="text-xs text-muted-foreground">
                Alumni connections
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Events Attended</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.eventsAttended || 0}</div>
              <p className="text-xs text-muted-foreground">
                This year
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mentorship Hours</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.mentorshipHours || 0}</div>
              <p className="text-xs text-muted-foreground">
                Hours contributed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Alumni Events</CardTitle>
            <CardDescription>
              Stay connected with upcoming events and activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { 
                  title: 'Annual Alumni Reunion', 
                  date: 'December 15, 2024', 
                  time: '6:00 PM', 
                  location: 'Main Auditorium',
                  type: 'reunion'
                },
                { 
                  title: 'Career Networking Session', 
                  date: 'January 20, 2025', 
                  time: '2:00 PM', 
                  location: 'Conference Hall',
                  type: 'networking'
                },
                { 
                  title: 'Mentorship Program Launch', 
                  date: 'February 5, 2025', 
                  time: '10:00 AM', 
                  location: 'Virtual Event',
                  type: 'mentorship'
                },
              ].map((event, index) => (
                <div key={index} className="flex items-center justify-between py-4 px-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-gray-500">
                        {event.date} • {event.time} • {event.location}
                      </p>
                    </div>
                  </div>
                  <Badge variant={
                    event.type === 'reunion' ? 'default' :
                    event.type === 'networking' ? 'secondary' : 'outline'
                  }>
                    {event.type === 'reunion' ? 'Reunion' :
                     event.type === 'networking' ? 'Networking' : 'Mentorship'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alumni Network */}
        <Card>
          <CardHeader>
            <CardTitle>Alumni Network</CardTitle>
            <CardDescription>
              Connect with fellow alumni in your field
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { 
                  name: 'Sarah Johnson', 
                  graduation: '2018', 
                  field: 'Software Engineering', 
                  company: 'Google',
                  status: 'available'
                },
                { 
                  name: 'Michael Brown', 
                  graduation: '2019', 
                  field: 'Data Science', 
                  company: 'Microsoft',
                  status: 'mentoring'
                },
                { 
                  name: 'Emily Davis', 
                  graduation: '2017', 
                  field: 'Product Management', 
                  company: 'Apple',
                  status: 'available'
                },
              ].map((alumni, index) => (
                <div key={index} className="flex items-center justify-between py-3 px-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{alumni.name}</p>
                      <p className="text-xs text-gray-500">
                        Class of {alumni.graduation} • {alumni.field} at {alumni.company}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <MessageSquare className="mr-2 h-3 w-3" />
                    Connect
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => router.push('/alumni/mentorship')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="mr-2 h-5 w-5" />
                Become a Mentor
              </CardTitle>
              <CardDescription>
                Share your expertise with current students
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push('/alumni/jobs')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Briefcase className="mr-2 h-5 w-5" />
                Job Board
              </CardTitle>
              <CardDescription>
                Post or find job opportunities
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push('/alumni/donate')}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="mr-2 h-5 w-5" />
                Give Back
              </CardTitle>
              <CardDescription>
                Support your alma mater
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
