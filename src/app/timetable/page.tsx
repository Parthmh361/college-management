'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Clock, 
  Calendar, 
  BookOpen,
  MapPin,
  User,
  Users,
  QrCode,
  ChevronRight,
  Download
} from 'lucide-react';

interface TimeSlot {
  _id?: string;
  startTime: string;
  endTime: string;
  subject: {
    _id: string;
    name: string;
    code: string;
  };
  teacher: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  room: string;
  type: 'lecture' | 'lab' | 'tutorial' | 'break';
}

interface TimetableEntry {
  day: string;
  timeSlots: TimeSlot[];
}

interface Timetable {
  _id: string;
  semester: number;
  department: string;
  academicYear: string;
  schedule: TimetableEntry[];
  isActive: boolean;
}

interface CurrentClass {
  subject: {
    _id: string;
    name: string;
    code: string;
  };
  startTime: string;
  endTime: string;
  room: string;
  type: string;
  isOngoing: boolean;
  isUpcoming: boolean;
  timeRemaining?: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TimetablePage() {
  const router = useRouter();
  // Define a LocalUser type for better type safety and to avoid conflicts
  interface LocalUser {
    _id: string;
    role: string;
    semester?: number;
    department?: string;
    [key: string]: any;
  }
  const [currentUser, setCurrentUser] = useState<LocalUser | null>(null);
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [currentClass, setCurrentClass] = useState<CurrentClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }));
  const [qrDialog, setQrDialog] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);

  // Filters for teachers to view different semesters/departments
  const [semesterFilter, setSemesterFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userData || !token) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setCurrentUser(parsedUser);
    
    // Auto-set filters based on user role
    if (parsedUser.role === 'Student') {
      setSemesterFilter(parsedUser.semester?.toString() || '');
      setDepartmentFilter(parsedUser.department || '');
    }
    
    fetchTimetable(parsedUser);
    fetchCurrentClass(parsedUser);
    
    // Set up interval to update current class every minute
    const interval = setInterval(() => fetchCurrentClass(parsedUser), 60000);
    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    if (currentUser) {
      fetchTimetable(currentUser);
    }
  }, [semesterFilter, departmentFilter]);

  const fetchTimetable = async (user: any) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = '/api/timetable';
      const params = new URLSearchParams();
      
      if (user.role === 'Student') {
        params.append('semester', user.semester?.toString() || '');
        params.append('department', user.department || '');
      } else if (user.role === 'Teacher') {
        if (semesterFilter) params.append('semester', semesterFilter);
        if (departmentFilter) params.append('department', departmentFilter);
      }
      
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const activeTimetable = data.timetables?.find((tt: Timetable) => tt.isActive) || data.timetables?.[0];
        setTimetable(activeTimetable || null);
      } else {
        // Mock data for demo
        setTimetable(generateMockTimetable(user));
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
      setTimetable(generateMockTimetable(user));
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentClass = async (user: any) => {
    if (user.role !== 'Teacher') return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/timetable/current', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentClass(data.currentClass || null);
      }
    } catch (error) {
      console.error('Error fetching current class:', error);
    }
  };

  const generateMockTimetable = (user: any): Timetable => {
    return {
      _id: 'mock-tt',
      semester: user.semester || 5,
      department: user.department || 'Computer Science',
      academicYear: '2024-25',
      isActive: true,
      schedule: [
        {
          day: 'Monday',
          timeSlots: [
            {
              _id: 'slot1',
              startTime: '09:00',
              endTime: '10:00',
              subject: { _id: 'sub1', name: 'Data Structures & Algorithms', code: 'CS301' },
              teacher: { _id: 'teacher1', firstName: 'Dr. Smith', lastName: 'Johnson', email: 'smith@college.edu' },
              room: 'CS-101',
              type: 'lecture'
            },
            {
              _id: 'slot2',
              startTime: '10:00',
              endTime: '11:00',
              subject: { _id: 'sub2', name: 'Database Management', code: 'CS302' },
              teacher: { _id: 'teacher2', firstName: 'Prof. Alice', lastName: 'Brown', email: 'alice@college.edu' },
              room: 'CS-102',
              type: 'lecture'
            },
            {
              _id: 'slot3',
              startTime: '11:00',
              endTime: '12:00',
              subject: { _id: 'sub3', name: 'Software Engineering', code: 'CS303' },
              teacher: { _id: 'teacher3', firstName: 'Dr. Michael', lastName: 'Davis', email: 'michael@college.edu' },
              room: 'CS-103',
              type: 'lecture'
            },
            {
              _id: 'slot4',
              startTime: '14:00',
              endTime: '17:00',
              subject: { _id: 'sub4', name: 'Database Lab', code: 'CS302L' },
              teacher: { _id: 'teacher2', firstName: 'Prof. Alice', lastName: 'Brown', email: 'alice@college.edu' },
              room: 'Lab-1',
              type: 'lab'
            }
          ]
        },
        {
          day: 'Tuesday',
          timeSlots: [
            {
              _id: 'slot5',
              startTime: '09:00',
              endTime: '10:00',
              subject: { _id: 'sub5', name: 'Computer Networks', code: 'CS304' },
              teacher: { _id: 'teacher4', firstName: 'Dr. Sarah', lastName: 'Wilson', email: 'sarah@college.edu' },
              room: 'CS-104',
              type: 'lecture'
            },
            {
              _id: 'slot6',
              startTime: '10:00',
              endTime: '11:00',
              subject: { _id: 'sub1', name: 'Data Structures & Algorithms', code: 'CS301' },
              teacher: { _id: 'teacher1', firstName: 'Dr. Smith', lastName: 'Johnson', email: 'smith@college.edu' },
              room: 'CS-101',
              type: 'tutorial'
            }
          ]
        },
        {
          day: 'Wednesday',
          timeSlots: [
            {
              _id: 'slot7',
              startTime: '09:00',
              endTime: '10:00',
              subject: { _id: 'sub2', name: 'Database Management', code: 'CS302' },
              teacher: { _id: 'teacher2', firstName: 'Prof. Alice', lastName: 'Brown', email: 'alice@college.edu' },
              room: 'CS-102',
              type: 'lecture'
            }
          ]
        },
        {
          day: 'Thursday',
          timeSlots: [
            {
              _id: 'slot8',
              startTime: '09:00',
              endTime: '10:00',
              subject: { _id: 'sub3', name: 'Software Engineering', code: 'CS303' },
              teacher: { _id: 'teacher3', firstName: 'Dr. Michael', lastName: 'Davis', email: 'michael@college.edu' },
              room: 'CS-103',
              type: 'lecture'
            },
            {
              _id: 'slot9',
              startTime: '14:00',
              endTime: '17:00',
              subject: { _id: 'sub6', name: 'Networks Lab', code: 'CS304L' },
              teacher: { _id: 'teacher4', firstName: 'Dr. Sarah', lastName: 'Wilson', email: 'sarah@college.edu' },
              room: 'Lab-2',
              type: 'lab'
            }
          ]
        },
        {
          day: 'Friday',
          timeSlots: [
            {
              _id: 'slot10',
              startTime: '09:00',
              endTime: '10:00',
              subject: { _id: 'sub5', name: 'Computer Networks', code: 'CS304' },
              teacher: { _id: 'teacher4', firstName: 'Dr. Sarah', lastName: 'Wilson', email: 'sarah@college.edu' },
              room: 'CS-104',
              type: 'lecture'
            }
          ]
        },
        {
          day: 'Saturday',
          timeSlots: []
        }
      ]
    };
  };

  const handleGenerateQR = async (classData: CurrentClass) => {
    if (!classData.subject._id) return;

    try {
      setGeneratingQR(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          subjectId: classData.subject._id,
          duration: 30, // 30 minutes default
          attendanceType: 'class'
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to QR display page or show QR in modal
        router.push(`/teacher/qr-codes?qrId=${data.qrCode._id}`);
      } else {
        console.error('Failed to generate QR code');
      }
    } catch (error) {
      console.error('Error generating QR:', error);
    } finally {
      setGeneratingQR(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lecture': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'lab': return 'bg-green-100 text-green-800 border-green-200';
      case 'tutorial': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'break': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}:00`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const isCurrentTime = (startTime: string, endTime: string) => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    return currentTime >= startTime && currentTime <= endTime;
  };

  if (loading) {
    return (
      <DashboardLayout user={currentUser as any}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-pulse mx-auto mb-4" />
            <p>Loading timetable...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={currentUser as any}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Class Timetable</h1>
            <p className="text-muted-foreground">
              {timetable ? 
                `${timetable.department} - Semester ${timetable.semester} (${timetable.academicYear})` :
                'View your class schedule and current classes'
              }
            </p>
          </div>
          {currentUser?.role === 'Teacher' && (
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          )}
        </div>

        {/* Current Class Card (for Teachers) */}
        {currentUser?.role === 'Teacher' && currentClass && (
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>
                      {currentClass.isOngoing ? 'Current Class' : 'Next Class'}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    {currentClass.subject.name} ({currentClass.subject.code})
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => handleGenerateQR(currentClass)}
                  disabled={generatingQR}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  {generatingQR ? 'Generating...' : 'Generate QR'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>{formatTime(currentClass.startTime)} - {formatTime(currentClass.endTime)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{currentClass.room}</span>
                </div>
                <div>
                  <Badge className={getTypeColor(currentClass.type)}>
                    {currentClass.type}
                  </Badge>
                </div>
              </div>
              {currentClass.timeRemaining && (
                <div className="mt-2 text-sm text-blue-600">
                  {currentClass.isOngoing ? 'Time remaining: ' : 'Starts in: '}{currentClass.timeRemaining}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Filters (for Teachers) */}
        {currentUser?.role === 'Teacher' && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Label>Semester</Label>
                  <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                        <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>Department</Label>
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Computer Science">Computer Science</SelectItem>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="Physics">Physics</SelectItem>
                      <SelectItem value="Chemistry">Chemistry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Timetable */}
        {timetable ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Weekly Schedule</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedDay} onValueChange={setSelectedDay} className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  {DAYS.map(day => (
                    <TabsTrigger 
                      key={day} 
                      value={day}
                      className={selectedDay === day ? 'bg-blue-100 text-blue-700' : ''}
                    >
                      {day}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {DAYS.map(day => {
                  const daySchedule = timetable.schedule.find(s => s.day === day);
                  
                  return (
                    <TabsContent key={day} value={day} className="space-y-4 mt-6">
                      {daySchedule?.timeSlots && daySchedule.timeSlots.length > 0 ? (
                        <div className="space-y-3">
                          {daySchedule.timeSlots
                            .sort((a, b) => a.startTime.localeCompare(b.startTime))
                            .map((slot, index) => {
                              const isCurrent = isCurrentTime(slot.startTime, slot.endTime);
                              
                              return (
                                <Card 
                                  key={slot._id} 
                                  className={`transition-all duration-200 hover:shadow-md ${
                                    isCurrent ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                                  }`}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                          <div className="text-lg font-semibold text-gray-900">
                                            {slot.subject.name}
                                          </div>
                                          <Badge className={getTypeColor(slot.type)}>
                                            {slot.type}
                                          </Badge>
                                          {isCurrent && (
                                            <Badge className="bg-green-100 text-green-800 border-green-200">
                                              Current
                                            </Badge>
                                          )}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                                          <div className="flex items-center space-x-2">
                                            <Clock className="h-4 w-4" />
                                            <span>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</span>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <User className="h-4 w-4" />
                                            <span>{slot.teacher.firstName} {slot.teacher.lastName}</span>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <MapPin className="h-4 w-4" />
                                            <span>{slot.room}</span>
                                          </div>
                                        </div>
                                        
                                        <div className="mt-2 text-xs text-gray-500">
                                          Subject Code: {slot.subject.code}
                                        </div>
                                      </div>
                                      
                                      {currentUser?.role === 'Teacher' && 
                                       slot.teacher._id === currentUser._id && 
                                       isCurrent && (
                                        <Button 
                                          size="sm"
                                          onClick={() => handleGenerateQR({
                                            subject: slot.subject,
                                            startTime: slot.startTime,
                                            endTime: slot.endTime,
                                            room: slot.room,
                                            type: slot.type,
                                            isOngoing: true,
                                            isUpcoming: false
                                          })}
                                          disabled={generatingQR}
                                        >
                                          <QrCode className="h-4 w-4 mr-2" />
                                          QR Code
                                        </Button>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No classes scheduled for {day}</p>
                        </div>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Timetable Available</h3>
              <p className="text-gray-600 mb-4">
                No timetable has been created for your semester and department yet.
              </p>
              {currentUser?.role === 'Admin' && (
                <Button onClick={() => router.push('/admin/timetable')}>
                  Create Timetable
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
