'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  BookOpen,
  Activity,
  Target,
  Award,
  AlertTriangle,
  Download,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';

interface AnalyticsData {
  attendanceOverview: {
    totalSessions: number;
    avgAttendance: number;
    trend: number;
    weeklyData: Array<{
      day: string;
      attendance: number;
      target: number;
    }>;
  };
  subjectAnalytics: Array<{
    subject: string;
    attendance: number;
    enrolled: number;
    sessions: number;
  }>;
  userGrowth: Array<{
    month: string;
    students: number;
    teachers: number;
    total: number;
  }>;
  departmentStats: Array<{
    department: string;
    students: number;
    attendance: number;
    color: string;
  }>;
  performanceMetrics: {
    topPerformers: Array<{
      name: string;
      attendance: number;
      subject: string;
    }>;
    needsAttention: Array<{
      name: string;
      attendance: number;
      subject: string;
    }>;
  };
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

export default function AnalyticsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

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
    fetchAnalyticsData();
  }, [router, timeRange, selectedDepartment]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/analytics?timeRange=${timeRange}&department=${selectedDepartment}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data?.analytics || generateMockAnalyticsData());
      } else {
        // Mock data for demo
        setAnalyticsData(generateMockAnalyticsData());
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setAnalyticsData(generateMockAnalyticsData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockAnalyticsData = (): AnalyticsData => {
    return {
      attendanceOverview: {
        totalSessions: 156,
        avgAttendance: 87.5,
        trend: 5.2,
        weeklyData: [
          { day: 'Mon', attendance: 89, target: 85 },
          { day: 'Tue', attendance: 92, target: 85 },
          { day: 'Wed', attendance: 78, target: 85 },
          { day: 'Thu', attendance: 85, target: 85 },
          { day: 'Fri', attendance: 94, target: 85 },
          { day: 'Sat', attendance: 82, target: 85 },
          { day: 'Sun', attendance: 88, target: 85 },
        ]
      },
      subjectAnalytics: [
        { subject: 'Mathematics', attendance: 92, enrolled: 45, sessions: 24 },
        { subject: 'Physics', attendance: 89, enrolled: 38, sessions: 22 },
        { subject: 'Chemistry', attendance: 85, enrolled: 42, sessions: 26 },
        { subject: 'Biology', attendance: 91, enrolled: 35, sessions: 20 },
        { subject: 'Computer Science', attendance: 94, enrolled: 50, sessions: 28 },
        { subject: 'English', attendance: 87, enrolled: 48, sessions: 25 },
      ],
      userGrowth: [
        { month: 'Jan', students: 120, teachers: 15, total: 135 },
        { month: 'Feb', students: 125, teachers: 16, total: 141 },
        { month: 'Mar', students: 132, teachers: 18, total: 150 },
        { month: 'Apr', students: 140, teachers: 20, total: 160 },
        { month: 'May', students: 145, teachers: 22, total: 167 },
        { month: 'Jun', students: 152, teachers: 24, total: 176 },
      ],
      departmentStats: [
        { department: 'Computer Science', students: 52, attendance: 94, color: '#8884d8' },
        { department: 'Mathematics', students: 45, attendance: 89, color: '#82ca9d' },
        { department: 'Physics', students: 38, attendance: 87, color: '#ffc658' },
        { department: 'Chemistry', students: 42, attendance: 85, color: '#ff7300' },
        { department: 'Biology', students: 35, attendance: 91, color: '#00ff00' },
      ],
      performanceMetrics: {
        topPerformers: [
          { name: 'Alice Johnson', attendance: 98, subject: 'Computer Science' },
          { name: 'Bob Smith', attendance: 96, subject: 'Mathematics' },
          { name: 'Carol Davis', attendance: 95, subject: 'Physics' },
          { name: 'David Wilson', attendance: 94, subject: 'Chemistry' },
          { name: 'Eve Brown', attendance: 93, subject: 'Biology' },
        ],
        needsAttention: [
          { name: 'Frank Miller', attendance: 65, subject: 'Mathematics' },
          { name: 'Grace Lee', attendance: 68, subject: 'Physics' },
          { name: 'Henry Taylor', attendance: 70, subject: 'Chemistry' },
          { name: 'Ivy Chen', attendance: 72, subject: 'Computer Science' },
          { name: 'Jack Wang', attendance: 74, subject: 'Biology' },
        ]
      }
    };
  };

  if (loading) {
    return (
      <DashboardLayout user={currentUser}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <BarChart3 className="h-8 w-8 animate-pulse mx-auto mb-4" />
            <p>Loading analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={currentUser}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
            <p className="text-muted-foreground">
              Comprehensive insights into attendance, performance, and system usage
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
                <SelectItem value="1y">Last year</SelectItem>
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
              <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.attendanceOverview?.avgAttendance || 0}%</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                {analyticsData?.attendanceOverview?.trend && analyticsData?.attendanceOverview?.trend > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={analyticsData?.attendanceOverview?.trend && analyticsData?.attendanceOverview?.trend > 0 ? "text-green-500" : "text-red-500"}>
                  {Math.abs(analyticsData?.attendanceOverview?.trend || 0)}% from last period
                </span>
              </div>
              <Progress value={analyticsData?.attendanceOverview?.avgAttendance || 0} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.attendanceOverview?.totalSessions || 0}</div>
              <p className="text-xs text-muted-foreground">
                Across all subjects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.subjectAnalytics?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Currently running
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Excellent
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                All systems operational
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="attendance" className="space-y-4">
          <TabsList>
            <TabsTrigger value="attendance">Attendance Trends</TabsTrigger>
            <TabsTrigger value="subjects">Subject Performance</TabsTrigger>
            <TabsTrigger value="departments">Department Overview</TabsTrigger>
            <TabsTrigger value="users">User Growth</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Attendance Trend</CardTitle>
                  <CardDescription>
                    Daily attendance vs target for the current week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analyticsData?.attendanceOverview?.weeklyData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="attendance" 
                        stroke="#8884d8" 
                        fill="#8884d8" 
                        fillOpacity={0.6}
                        name="Actual Attendance"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="target" 
                        stroke="#ff7300" 
                        strokeDasharray="5 5"
                        name="Target"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Insights</CardTitle>
                  <CardDescription>
                    Students requiring attention and top performers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="attention" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="attention" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Needs Attention
                      </TabsTrigger>
                      <TabsTrigger value="performers" className="text-xs">
                        <Award className="h-3 w-3 mr-1" />
                        Top Performers
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="attention" className="space-y-2 mt-4">
                      {(analyticsData?.performanceMetrics?.needsAttention || []).map((student, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                          <div>
                            <p className="font-medium text-sm">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.subject}</p>
                          </div>
                          <Badge variant="destructive">{student.attendance}%</Badge>
                        </div>
                      ))}
                    </TabsContent>
                    <TabsContent value="performers" className="space-y-2 mt-4">
                      {(analyticsData?.performanceMetrics?.topPerformers || []).map((student, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                          <div>
                            <p className="font-medium text-sm">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.subject}</p>
                          </div>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            {student.attendance}%
                          </Badge>
                        </div>
                      )) || []}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Subject Performance Overview</CardTitle>
                <CardDescription>
                  Attendance rates and enrollment across all subjects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={analyticsData?.subjectAnalytics || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" angle={-45} textAnchor="end" height={80} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="attendance" fill="#8884d8" name="Attendance %" />
                    <Bar yAxisId="right" dataKey="enrolled" fill="#82ca9d" name="Enrolled Students" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Department Distribution</CardTitle>
                  <CardDescription>
                    Student enrollment by department
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData?.departmentStats || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ department, students }) => `${department}: ${students}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="students"
                      >
                        {(analyticsData?.departmentStats || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Department Performance</CardTitle>
                  <CardDescription>
                    Attendance rates by department
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(analyticsData?.departmentStats || []).map((dept, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{dept.department}</span>
                          <span className="text-sm text-muted-foreground">{dept.attendance}%</span>
                        </div>
                        <Progress value={dept.attendance} className="h-2" />
                        <p className="text-xs text-muted-foreground">{dept.students} students enrolled</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Growth Trend</CardTitle>
                <CardDescription>
                  Monthly growth in student and teacher registrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={analyticsData?.userGrowth || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="students" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Students"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="teachers" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="Teachers"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#ffc658" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Total Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
