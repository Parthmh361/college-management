'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  UserCheck, 
  UserX, 
  Calendar, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Download,
  Filter,
  Users,
  BookOpen,
  Target,
  Award
} from 'lucide-react';

interface AttendanceOverview {
  totalSessions: number;
  totalStudents: number;
  avgAttendance: number;
  attendanceToday: number;
  trend: number;
  lowAttendanceStudents: number;
}

interface SubjectAttendance {
  subject: string;
  code: string;
  totalSessions: number;
  avgAttendance: number;
  enrolledStudents: number;
  lastSession: string;
  teacher: string;
}

interface StudentAttendance {
  studentId: string;
  name: string;
  department: string;
  semester: number;
  totalSessions: number;
  attendedSessions: number;
  attendanceRate: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

interface DailyAttendance {
  date: string;
  present: number;
  absent: number;
  total: number;
  rate: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AttendanceOverviewPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [overview, setOverview] = useState<AttendanceOverview | null>(null);
  const [subjectAttendance, setSubjectAttendance] = useState<SubjectAttendance[]>([]);
  const [studentAttendance, setStudentAttendance] = useState<StudentAttendance[]>([]);
  const [dailyAttendance, setDailyAttendance] = useState<DailyAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userData || !token) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'Admin') {
      router.push('/dashboard');
      return;
    }

    setCurrentUser(parsedUser);
    fetchAttendanceData();
  }, [router, timeRange, selectedDepartment, selectedSubject]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/attendance/overview?timeRange=${timeRange}&department=${selectedDepartment}&subject=${selectedSubject}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOverview(data.overview);
        setSubjectAttendance(data.subjectAttendance);
        setStudentAttendance(data.studentAttendance);
        setDailyAttendance(data.dailyAttendance);
      } else {
        // Mock data for demo
        generateMockData();
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      generateMockData();
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = () => {
    setOverview({
      totalSessions: 420,
      totalStudents: 150,
      avgAttendance: 87.3,
      attendanceToday: 89.5,
      trend: 2.4,
      lowAttendanceStudents: 12
    });

    setSubjectAttendance([
      {
        subject: 'Computer Science 101',
        code: 'CS101',
        totalSessions: 25,
        avgAttendance: 92.1,
        enrolledStudents: 45,
        lastSession: '2024-01-15T10:00:00Z',
        teacher: 'Dr. Smith'
      },
      {
        subject: 'Mathematics',
        code: 'MATH201',
        totalSessions: 28,
        avgAttendance: 88.7,
        enrolledStudents: 42,
        lastSession: '2024-01-15T14:00:00Z',
        teacher: 'Prof. Johnson'
      },
      {
        subject: 'Physics',
        code: 'PHY101',
        totalSessions: 22,
        avgAttendance: 85.3,
        enrolledStudents: 38,
        lastSession: '2024-01-14T11:00:00Z',
        teacher: 'Dr. Wilson'
      },
      {
        subject: 'Chemistry',
        code: 'CHEM101',
        totalSessions: 24,
        avgAttendance: 90.2,
        enrolledStudents: 40,
        lastSession: '2024-01-15T09:00:00Z',
        teacher: 'Dr. Brown'
      }
    ]);

    setStudentAttendance([
      {
        studentId: 'STU001',
        name: 'Alice Johnson',
        department: 'Computer Science',
        semester: 3,
        totalSessions: 45,
        attendedSessions: 44,
        attendanceRate: 97.8,
        status: 'excellent'
      },
      {
        studentId: 'STU002',
        name: 'Bob Smith',
        department: 'Mathematics',
        semester: 2,
        totalSessions: 42,
        attendedSessions: 38,
        attendanceRate: 90.5,
        status: 'good'
      },
      {
        studentId: 'STU003',
        name: 'Carol Davis',
        department: 'Physics',
        semester: 4,
        totalSessions: 40,
        attendedSessions: 32,
        attendanceRate: 80.0,
        status: 'warning'
      },
      {
        studentId: 'STU004',
        name: 'David Wilson',
        department: 'Chemistry',
        semester: 1,
        totalSessions: 38,
        attendedSessions: 25,
        attendanceRate: 65.8,
        status: 'critical'
      }
    ]);

    setDailyAttendance([
      { date: '2024-01-08', present: 132, absent: 18, total: 150, rate: 88.0 },
      { date: '2024-01-09', present: 128, absent: 22, total: 150, rate: 85.3 },
      { date: '2024-01-10', present: 135, absent: 15, total: 150, rate: 90.0 },
      { date: '2024-01-11', present: 140, absent: 10, total: 150, rate: 93.3 },
      { date: '2024-01-12', present: 125, absent: 25, total: 150, rate: 83.3 },
      { date: '2024-01-15', present: 134, absent: 16, total: 150, rate: 89.3 }
    ]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'excellent':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Excellent</Badge>;
      case 'good':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Good</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Warning</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Critical</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-blue-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <DashboardLayout user={currentUser}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <UserCheck className="h-8 w-8 animate-pulse mx-auto mb-4" />
            <p>Loading attendance data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={currentUser}>
      <div className="space-y-6">{/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Attendance Overview</h1>
            <p className="text-muted-foreground">
              Comprehensive attendance tracking and analytics
            </p>
          </div>
          <div className="flex space-x-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 3 months</SelectItem>
                <SelectItem value="1y">This year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.avgAttendance}%</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                {overview?.trend && overview.trend > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={overview?.trend && overview.trend > 0 ? "text-green-500" : "text-red-500"}>
                  {Math.abs(overview?.trend || 0)}% from last period
                </span>
              </div>
              <Progress value={overview?.avgAttendance} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.attendanceToday}%</div>
              <p className="text-xs text-muted-foreground">
                {overview?.totalStudents} total students
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overview?.totalSessions}</div>
              <p className="text-xs text-muted-foreground">
                Across all subjects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">At Risk Students</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overview?.lowAttendanceStudents}</div>
              <p className="text-xs text-muted-foreground">
                Below 75% attendance
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Tabs */}
        <Tabs defaultValue="daily-trends" className="space-y-4">
          <TabsList>
            <TabsTrigger value="daily-trends">Daily Trends</TabsTrigger>
            <TabsTrigger value="subject-performance">Subject Performance</TabsTrigger>
            <TabsTrigger value="student-details">Student Details</TabsTrigger>
            <TabsTrigger value="alerts">Alerts & Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="daily-trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Daily Attendance Trends</CardTitle>
                <CardDescription>
                  Attendance patterns over the selected time period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={dailyAttendance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="rate" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Attendance Rate (%)"
                    />
                    <Bar dataKey="present" fill="#82ca9d" name="Present" />
                    <Bar dataKey="absent" fill="#ff7300" name="Absent" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subject-performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Subject-wise Attendance</CardTitle>
                <CardDescription>
                  Attendance performance across different subjects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {subjectAttendance.map((subject, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{subject.subject}</h4>
                          <p className="text-sm text-muted-foreground">
                            {subject.code} • {subject.teacher} • {subject.enrolledStudents} students
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getAttendanceColor(subject.avgAttendance)}`}>
                            {subject.avgAttendance}%
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {subject.totalSessions} sessions
                          </p>
                        </div>
                      </div>
                      <Progress value={subject.avgAttendance} className="mt-2" />
                      <p className="text-xs text-muted-foreground mt-2">
                        Last session: {new Date(subject.lastSession).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="student-details" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Attendance Details</CardTitle>
                <CardDescription>
                  Individual student attendance performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {studentAttendance.map((student, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h4 className="font-medium">{student.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {student.studentId} • {student.department} • Semester {student.semester}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className={`text-lg font-bold ${getAttendanceColor(student.attendanceRate)}`}>
                              {student.attendanceRate}%
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {student.attendedSessions}/{student.totalSessions} sessions
                            </p>
                          </div>
                          {getStatusBadge(student.status)}
                        </div>
                      </div>
                      <Progress value={student.attendanceRate} className="mt-3" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                    Critical Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="bg-red-50 border border-red-200 rounded p-3">
                      <h5 className="font-medium text-red-800">Low Attendance Warning</h5>
                      <p className="text-sm text-red-600">
                        12 students have attendance below 75%
                      </p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <h5 className="font-medium text-yellow-800">Subject Alert</h5>
                      <p className="text-sm text-yellow-600">
                        Physics class attendance dropped by 8% this week
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="h-5 w-5 mr-2 text-green-500" />
                    Recognition
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <h5 className="font-medium text-green-800">Perfect Attendance</h5>
                      <p className="text-sm text-green-600">
                        8 students maintained 100% attendance this month
                      </p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <h5 className="font-medium text-blue-800">Improvement</h5>
                      <p className="text-sm text-blue-600">
                        Computer Science class improved by 12% this month
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
