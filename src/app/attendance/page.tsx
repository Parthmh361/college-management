'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Filter, 
  Download, 
  Search,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface Subject {
  _id: string;
  name: string;
  code: string;
}

interface AttendanceRecord {
  _id: string;
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    studentId: string;
  };
  subject: {
    _id: string;
    name: string;
    code: string;
  };
  teacher: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  status: 'Present' | 'Absent' | 'Late';
  date: string;
  markedAt: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface AttendanceStats {
  totalClasses: number;
  presentClasses: number;
  absentClasses: number;
  lateClasses: number;
  attendanceRate: number;
}

export default function AttendanceManagement() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [filters, setFilters] = useState({
    subjectId: 'all',
    studentId: '',
    startDate: '',
    endDate: '',
    status: 'all',
    page: 1,
    limit: 10
  });

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userData || !token) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    
    fetchSubjects();
    fetchAttendanceRecords();
  }, [router, filters]);

  // Separate useEffect for fetchAttendanceStats that depends on user being set
  useEffect(() => {
    if (user) {
      fetchAttendanceStats();
    }
  }, [user, filters.subjectId, filters.studentId]);

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/subjects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.data.subjects || []);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams();
      if (filters.subjectId && filters.subjectId !== 'all') params.append('subjectId', filters.subjectId);
      if (filters.studentId) params.append('studentId', filters.studentId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.status && filters.status !== 'all') params.append('status', filters.status);
      params.append('page', filters.page.toString());
      params.append('limit', filters.limit.toString());
      
      const response = await fetch(`/api/attendance?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAttendanceRecords(data.data.attendance || []);
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to fetch attendance records');
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setError('Failed to fetch attendance records');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceStats = async () => {
    if (!filters.subjectId || !user || filters.subjectId === 'all') return;
    
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('subjectId', filters.subjectId);
      if (user.role === 'Student') {
        params.append('studentId', user.id);
      } else if (filters.studentId) {
        params.append('studentId', filters.studentId);
      }
      
      const response = await fetch(`/api/attendance?type=stats&${params.toString()}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.data.statistics);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const resetFilters = () => {
    setFilters({
      subjectId: 'all',
      studentId: '',
      startDate: '',
      endDate: '',
      status: 'all',
      page: 1,
      limit: 10
    });
    setSearchTerm('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Present':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Late':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'Absent':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'bg-green-100 text-green-800';
      case 'Late':
        return 'bg-yellow-100 text-yellow-800';
      case 'Absent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.subjectId) params.append('subjectId', filters.subjectId);
      if (filters.studentId) params.append('studentId', filters.studentId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('export', 'true');
      
      const response = await fetch(`/api/attendance?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting attendance:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
            <p className="text-gray-600">Track and manage attendance records</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={exportAttendance}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={fetchAttendanceRecords}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalClasses}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Present</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.presentClasses}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Absent</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.absentClasses}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select value={filters.subjectId} onValueChange={(value) => handleFilterChange('subjectId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All subjects</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject._id} value={subject._id}>
                        {subject.name} ({subject.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  type="date"
                  id="startDate"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  type="date"
                  id="endDate"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="Present">Present</SelectItem>
                    <SelectItem value="Late">Late</SelectItem>
                    <SelectItem value="Absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              <Button variant="outline" onClick={resetFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Attendance Records
            </CardTitle>
            <CardDescription>
              {attendanceRecords.length} records found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Loading attendance records...</span>
              </div>
            ) : attendanceRecords.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No attendance records found</p>
                <p className="text-sm text-gray-400">Try adjusting your filters or date range</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Student</th>
                      <th className="text-left py-3 px-4 font-medium">Subject</th>
                      <th className="text-left py-3 px-4 font-medium">Date</th>
                      <th className="text-left py-3 px-4 font-medium">Status</th>
                      <th className="text-left py-3 px-4 font-medium">Marked At</th>
                      {user && user.role === 'Admin' && (
                        <th className="text-left py-3 px-4 font-medium">Teacher</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRecords
                      .filter(record => 
                        !searchTerm || 
                        (record.student && `${record.student.firstName} ${record.student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (record.student && record.student.studentId && record.student.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
                      )
                      .map((record) => (
                        <tr key={record._id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">
                                {record.student ? `${record.student.firstName} ${record.student.lastName}` : 'Unknown Student'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {record.student?.studentId || 'N/A'}
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{record.subject?.name || 'Unknown Subject'}</p>
                              <p className="text-sm text-gray-500">{record.subject?.code || 'N/A'}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              {getStatusIcon(record.status)}
                              <Badge className={`ml-2 ${getStatusColor(record.status)}`}>
                                {record.status}
                              </Badge>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {record.markedAt ? new Date(record.markedAt).toLocaleString() : 'N/A'}
                          </td>
                          {user && user.role === 'Admin' && (
                            <td className="py-3 px-4">
                              {record.teacher ? `${record.teacher.firstName} ${record.teacher.lastName}` : 'Unknown Teacher'}
                            </td>
                          )}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
