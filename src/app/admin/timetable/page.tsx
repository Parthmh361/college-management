'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useAcademicStore } from '@/stores/academicStore';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  Calendar, 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  BookOpen,
  MapPin,
  User,
  CheckCircle,
  AlertCircle
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

interface Section {
  sectionName: string;
  schedule: TimetableEntry[];
}

interface Timetable {
  _id: string;
  semester: number;
  department: string;
  academicYear: string;
  sections: Section[];
  isActive: boolean;
  createdBy: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00'
];

export default function AdminTimetablePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [subjects, setSubjects] = useState<Array<{ _id: string; name: string; code: string }>>([]);
  const [teachers, setTeachers] = useState<Array<{ _id: string; firstName: string; lastName: string; email: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimetable, setSelectedTimetable] = useState<Timetable | null>(null);
  const [editDialog, setEditDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creating, setCreating] = useState(false);
  
  // Filters
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Form state
  const [timetableForm, setTimetableForm] = useState({
    semester: '',
    department: '',
    academicYear: '2024-25'
  });

  const [editingSlot, setEditingSlot] = useState<{
    sectionName: string;
    day: string;
    slotIndex: number;
    slot: TimeSlot | null;
  } | null>(null);

  const [selectedSection, setSelectedSection] = useState('A');
  const [newSectionName, setNewSectionName] = useState('');
  const [showAddSectionDialog, setShowAddSectionDialog] = useState(false);

  const [slotForm, setSlotForm] = useState({
    startTime: '',
    endTime: '',
    subject: '',
    teacher: '',
    room: '',
    type: 'lecture' as 'lecture' | 'lab' | 'tutorial' | 'break'
  });

  // Use academic store for departments
  const departments = useAcademicStore(state => state.departments);

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
    fetchDepartments();
    fetchTimetables();
    fetchSubjects();
    fetchTeachers();
  }, [router]);

  const fetchDepartments = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/admin/departments', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      useAcademicStore.getState().setDepartments(data.departments || []);
    }
  };

  const fetchTimetables = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = '/api/timetable';
      const params = new URLSearchParams();
      if (semesterFilter !== 'all') params.append('semester', semesterFilter);
      if (departmentFilter !== 'all') params.append('department', departmentFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTimetables(data.timetables || []);
      } else {
        setTimetables([]);
        setError('Failed to fetch timetables');
      }
    } catch (error) {
      setTimetables([]);
      setError('Failed to fetch timetables');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/subjects?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const fetchedSubjects = data.data?.subjects || data.subjects || [];
        setSubjects(fetchedSubjects);
      } else {
        setSubjects([]);
        setError('Failed to fetch subjects');
      }
    } catch (error) {
      setSubjects([]);
      setError('Failed to fetch subjects');
    }
  };

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users?role=Teacher', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        const fetchedTeachers = data.users || data.data?.users || [];
        setTeachers(fetchedTeachers);
      } else {
        setTeachers([]);
        setError('Failed to fetch teachers');
      }
    } catch (error) {
      setTeachers([]);
      setError('Failed to fetch teachers');
    }
  };

  const handleCreateTimetable = async () => {
    if (!timetableForm.semester || !timetableForm.department) {
      setError('Please select both semester and department');
      return;
    }

    try {
      setCreating(true);
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('token');
      const newTimetable = {
        ...timetableForm,
        semester: parseInt(timetableForm.semester),
        sections: [
          {
            sectionName: 'A',
            schedule: DAYS.map(day => ({ day, timeSlots: [] }))
          }
        ]
      };

      const response = await fetch('/api/timetable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newTimetable)
      });

      const data = await response.json();

      if (response.ok) {
        setTimetables(prev => [...prev, data.timetable]);
        setCreateDialog(false);
        setTimetableForm({ semester: '', department: '', academicYear: '2024-25' });
        setSuccess('Timetable created successfully!');
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
      } else {
        if (response.status === 409) {
          setError(`A timetable already exists for ${timetableForm.department} Semester ${timetableForm.semester}. Please edit the existing timetable or choose a different combination.`);
        } else {
          setError(data.error || 'Failed to create timetable');
        }
      }
    } catch (error) {
      console.error('Error creating timetable:', error);
      setError('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleEditSlot = (sectionName: string, day: string, slotIndex: number, slot: TimeSlot | null = null) => {
    console.log('Edit slot called - subjects available:', subjects.length);
    console.log('Subjects:', subjects);
    
    setEditingSlot({ sectionName, day, slotIndex, slot });
    if (slot) {
      setSlotForm({
        startTime: slot.startTime,
        endTime: slot.endTime,
        subject: slot.subject._id,
        teacher: slot.teacher._id,
        room: slot.room,
        type: slot.type
      });
    } else {
      setSlotForm({
        startTime: '',
        endTime: '',
        subject: '',
        teacher: '',
        room: '',
        type: 'lecture'
      });
    }
  };

  const handleSaveSlot = async () => {
    if (!selectedTimetable || !editingSlot) return;

    try {
      const updatedSections = [...selectedTimetable.sections];
      const sectionIndex = updatedSections.findIndex(s => s.sectionName === editingSlot.sectionName);
      
      if (sectionIndex !== -1) {
        const section = updatedSections[sectionIndex];
        const dayEntry = section.schedule.find(s => s.day === editingSlot.day);
        
        if (dayEntry) {
          const selectedSubject = subjects.find((s: any) => s._id === slotForm.subject);
          const selectedTeacher = teachers.find((t: any) => t._id === slotForm.teacher);

          const newSlot: TimeSlot = {
            _id: editingSlot.slot?._id || `slot_${Date.now()}`,
            startTime: slotForm.startTime,
            endTime: slotForm.endTime,
            subject: selectedSubject ? { _id: selectedSubject._id, name: selectedSubject.name, code: selectedSubject.code } : { _id: '', name: '', code: '' },
            teacher: selectedTeacher ? { 
              _id: selectedTeacher._id, 
              firstName: selectedTeacher.firstName, 
              lastName: selectedTeacher.lastName, 
              email: selectedTeacher.email 
            } : { _id: '', firstName: '', lastName: '', email: '' },
            room: slotForm.room,
            type: slotForm.type
          };

          if (editingSlot.slot) {
            // Update existing slot
            dayEntry.timeSlots[editingSlot.slotIndex] = newSlot;
          } else {
            // Add new slot
            dayEntry.timeSlots.push(newSlot);
            dayEntry.timeSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
          }

          const updatedTimetable = { ...selectedTimetable, sections: updatedSections };
          
          // Update local state
          setSelectedTimetable(updatedTimetable);
          setTimetables(prev => prev.map(tt => tt._id === selectedTimetable._id ? updatedTimetable : tt));
          
          setEditingSlot(null);
        }
      }
    } catch (error) {
      console.error('Error saving slot:', error);
    }
  };

  const handleDeleteSlot = (sectionName: string, day: string, slotIndex: number) => {
    if (!selectedTimetable) return;

    const updatedSections = [...selectedTimetable.sections];
    const sectionIndex = updatedSections.findIndex(s => s.sectionName === sectionName);
    
    if (sectionIndex !== -1) {
      const section = updatedSections[sectionIndex];
      const dayEntry = section.schedule.find(s => s.day === day);
      
      if (dayEntry) {
        dayEntry.timeSlots.splice(slotIndex, 1);
        
        const updatedTimetable = { ...selectedTimetable, sections: updatedSections };
        setSelectedTimetable(updatedTimetable);
        setTimetables(prev => prev.map(tt => tt._id === selectedTimetable._id ? updatedTimetable : tt));
      }
    }
  };

  const handleAddSection = () => {
    setShowAddSectionDialog(true);
  };

  const handleCreateSection = () => {
    if (!selectedTimetable || !newSectionName.trim()) return;

    const updatedSections = [...selectedTimetable.sections];
    const newSection: Section = {
      sectionName: newSectionName.toUpperCase(),
      schedule: DAYS.map(day => ({ day, timeSlots: [] }))
    };
    
    updatedSections.push(newSection);
    const updatedTimetable = { ...selectedTimetable, sections: updatedSections };
    
    setSelectedTimetable(updatedTimetable);
    setTimetables(prev => prev.map(tt => tt._id === selectedTimetable._id ? updatedTimetable : tt));
    setNewSectionName('');
    setShowAddSectionDialog(false);
    setSelectedSection(newSection.sectionName);
  };

  const handleDeleteSection = (sectionName: string) => {
    if (!selectedTimetable || selectedTimetable.sections.length <= 1) return;

    const updatedSections = selectedTimetable.sections.filter(s => s.sectionName !== sectionName);
    const updatedTimetable = { ...selectedTimetable, sections: updatedSections };
    
    setSelectedTimetable(updatedTimetable);
    setTimetables(prev => prev.map(tt => tt._id === selectedTimetable._id ? updatedTimetable : tt));
    
    // If we deleted the currently selected section, switch to the first available
    if (selectedSection === sectionName) {
      setSelectedSection(updatedSections[0]?.sectionName || 'A');
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lecture': return 'bg-blue-100 text-blue-800';
      case 'lab': return 'bg-green-100 text-green-800';
      case 'tutorial': return 'bg-purple-100 text-purple-800';
      case 'break': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <DashboardLayout user={currentUser}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-pulse mx-auto mb-4" />
            <p>Loading timetables...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={currentUser}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Timetable Management</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Create and manage class timetables for all departments and semesters
            </p>
          </div>
          <Button
            className="w-full md:w-auto"
            onClick={() => {
              setCreateDialog(true);
              setError('');
              setSuccess('');
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Timetable
          </Button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 min-w-0">
                <Label>Semester</Label>
                <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Semesters" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Semesters</SelectItem>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-0">
                <Label>Department</Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept.code} value={dept.code}>
                        {dept.name} ({dept.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={fetchTimetables} className="w-full md:w-auto">Apply Filters</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timetables List */}
        <div className="grid gap-6">
          {timetables.map((timetable) => (
            <Card key={timetable._id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                      <Calendar className="h-5 w-5" />
                      <span>{timetable.department} - Semester {timetable.semester}</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Academic Year: {timetable.academicYear} | 
                      Created by: {timetable.createdBy.firstName} {timetable.createdBy.lastName}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2 w-full sm:w-auto">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        setSelectedTimetable(timetable);
                        setEditDialog(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Schedule
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Timetable Grid */}
                <div className="overflow-x-auto">
                  <div className="min-w-[600px]">
                    <div className="grid border-b bg-gray-50 mb-2 text-xs sm:text-sm" style={{gridTemplateColumns: `100px repeat(${Math.min(TIME_SLOTS.length - 1, 8)}, 1fr)`}}>
                      <div className="p-2 font-semibold text-center border-r">Day</div>
                      {TIME_SLOTS.slice(0, 8).map((time, index) => {
                        const endTime = TIME_SLOTS[index + 1];
                        return (
                          <div key={time} className="p-1 font-semibold text-center border-r last:border-r-0">
                            <div className="font-mono text-xs">{time}</div>
                            {endTime && <div className="text-xs text-gray-500">to {endTime}</div>}
                          </div>
                        );
                      })}
                    </div>
                    {/* Day Rows */}
                    {DAYS.map(day => (
                      <div key={day} className="mb-3">
                        {/* Day Header */}
                        <div className="grid border-b bg-gray-100" style={{gridTemplateColumns: `100px repeat(${Math.min(TIME_SLOTS.length - 1, 8)}, 1fr)`}}>
                          <div className="p-2 font-medium border-r bg-gray-100">
                            <div>{day.slice(0, 3)}</div>
                            <div className="text-xs text-gray-500">{timetable.sections.length} sec.</div>
                          </div>
                          {TIME_SLOTS.slice(0, 8).map(time => (
                            <div key={time} className="p-1 border-r last:border-r-0 bg-gray-100">
                              <div className="text-xs text-gray-400 text-center">{time}</div>
                            </div>
                          ))}
                        </div>
                        {/* Section Rows for this day */}
                        {timetable.sections.map(section => (
                          <div 
                            key={`${day}-${section.sectionName}`} 
                            className="grid border-b hover:bg-blue-50 transition-colors"
                            style={{gridTemplateColumns: `100px repeat(${Math.min(TIME_SLOTS.length - 1, 8)}, 1fr)`}}
                          >
                            {/* Section Name */}
                            <div className="p-2 border-r bg-white flex items-center">
                              <Badge variant="outline" className="text-xs">
                                Sec {section.sectionName}
                              </Badge>
                            </div>
                            {/* Time Slot Cells */}
                            {TIME_SLOTS.slice(0, 8).map((time, timeIndex) => {
                              const endTime = TIME_SLOTS[timeIndex + 1];
                              const daySchedule = section.schedule.find(s => s.day === day);
                              const slot = daySchedule?.timeSlots.find(ts => 
                                ts.startTime === time && (endTime ? ts.endTime === endTime : true)
                              );
                              return (
                                <div 
                                  key={time} 
                                  className="p-1 border-r last:border-r-0 min-h-[50px] relative group"
                                >
                                  {slot ? (
                                    <div className="text-xs space-y-1">
                                      <div className="font-medium text-blue-700 truncate" title={slot.subject.name}>
                                        {slot.subject.code}
                                      </div>
                                      <div className="text-gray-600 truncate">{slot.room}</div>
                                      <div className="flex items-center justify-between">
                                        <Badge className={`text-xs ${getTypeColor(slot.type)}`}>
                                          {slot.type.charAt(0)}
                                        </Badge>
                                        <span className="text-xs text-gray-400 truncate" title={`${slot.teacher.firstName} ${slot.teacher.lastName}`}>
                                          {slot.teacher.firstName.charAt(0)}.{slot.teacher.lastName.slice(0,4)}
                                        </span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="h-full flex items-center justify-center text-gray-200 group-hover:text-gray-400">
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Plus className="h-3 w-3" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Timetable Dialog */}
        <Dialog open={createDialog} onOpenChange={setCreateDialog}>
          <DialogContent className="max-w-full sm:max-w-lg md:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Timetable</DialogTitle>
              <DialogDescription>
                Create a new timetable for a specific semester and department.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 grid-cols-1 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="semester" className="text-right">Semester</Label>
                <Select 
                  value={timetableForm.semester}
                  onValueChange={(value) => setTimetableForm({ ...timetableForm, semester: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                      <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="department" className="text-right">Department</Label>
                <Select 
                  value={timetableForm.department}
                  onValueChange={(value) => setTimetableForm({ ...timetableForm, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept.code} value={dept.code}>
                        {dept.name} ({dept.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <Label htmlFor="year" className="text-right">Academic Year</Label>
                <Input
                  id="year"
                  value={timetableForm.academicYear}
                  onChange={(e) => setTimetableForm({ ...timetableForm, academicYear: e.target.value })}
                  placeholder="2024-25"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialog(false)} disabled={creating}>
                Cancel
              </Button>
              <Button onClick={handleCreateTimetable} disabled={creating}>
                {creating ? 'Creating...' : 'Create Timetable'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Timetable Dialog */}
        <Dialog open={editDialog} onOpenChange={setEditDialog}>
          <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Edit Timetable - {selectedTimetable?.department} Semester {selectedTimetable?.semester}
              </DialogTitle>
              <DialogDescription>
                Click on any time slot to add or edit classes. Empty slots can be clicked to add new classes.
              </DialogDescription>
            </DialogHeader>
            
            {selectedTimetable && (
              <div className="space-y-6">
                {/* Section Management */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Label className="font-semibold">Available Sections:</Label>
                    <div className="flex space-x-2">
                      {selectedTimetable.sections.map(section => (
                        <Badge key={section.sectionName} variant="outline" className="px-3 py-1">
                          {section.sectionName}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleAddSection}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Section
                    </Button>
                    {selectedTimetable.sections.length > 1 && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDeleteSection(selectedSection)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Section
                      </Button>
                    )}
                  </div>
                </div>

                {/* Enhanced Grid Layout - Time as Columns (Top), Days as Rows (Left) */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 p-4 border-b">
                    <h3 className="font-semibold">Complete Timetable - All Sections</h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <div className="min-w-[1200px]">
                      {/* Header Row - Time Slots */}
                      <div className="grid border-b bg-gray-100" style={{gridTemplateColumns: `120px repeat(${TIME_SLOTS.length - 1}, 1fr)`}}>
                        <div className="p-3 font-semibold text-center border-r sticky left-0 bg-gray-100 z-10">
                          Day
                        </div>
                        {TIME_SLOTS.slice(0, -1).map((timeSlot, timeIndex) => {
                          const endTime = TIME_SLOTS[timeIndex + 1];
                          return (
                            <div key={timeSlot} className="p-2 font-semibold text-center border-r last:border-r-0">
                              <div className="font-mono text-sm">{timeSlot}</div>
                              <div className="text-xs text-gray-500">to {endTime}</div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Day Rows */}
                      {DAYS.map(day => (
                        <div key={day}>
                          {/* Day Header */}
                          <div className="grid border-b bg-gray-50" style={{gridTemplateColumns: `120px repeat(${TIME_SLOTS.length - 1}, 1fr)`}}>
                            <div className="p-4 font-semibold border-r sticky left-0 bg-gray-50 z-10 flex items-center">
                              <div>
                                <div className="font-medium">{day}</div>
                                <div className="text-xs text-gray-500">{selectedTimetable.sections.length} sections</div>
                              </div>
                            </div>
                            {TIME_SLOTS.slice(0, -1).map((timeSlot, timeIndex) => (
                              <div key={timeSlot} className="p-1 border-r last:border-r-0 bg-gray-50">
                                <div className="text-xs text-gray-400 text-center">
                                  {timeSlot} - {TIME_SLOTS[timeIndex + 1]}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Section Rows for this day */}
                          {selectedTimetable.sections.map(section => (
                            <div 
                              key={`${day}-${section.sectionName}`} 
                              className="grid border-b hover:bg-blue-50 transition-colors"
                              style={{gridTemplateColumns: `120px repeat(${TIME_SLOTS.length - 1}, 1fr)`}}
                            >
                              {/* Section Name */}
                              <div className="p-3 border-r sticky left-0 bg-white z-10 flex items-center">
                                <Badge variant="outline" className="font-medium">
                                  Section {section.sectionName}
                                </Badge>
                              </div>

                              {/* Time Slot Cells */}
                              {TIME_SLOTS.slice(0, -1).map((timeSlot, timeIndex) => {
                                const endTime = TIME_SLOTS[timeIndex + 1];
                                const daySchedule = section.schedule.find(s => s.day === day);
                                const slot = daySchedule?.timeSlots.find(ts => 
                                  ts.startTime === timeSlot && ts.endTime === endTime
                                );

                                return (
                                  <div 
                                    key={timeSlot} 
                                    className="p-2 border-r last:border-r-0 min-h-[70px] relative group cursor-pointer hover:bg-blue-100 transition-colors"
                                    onClick={() => handleEditSlot(section.sectionName, day, daySchedule?.timeSlots.length || 0, slot)}
                                  >
                                    {slot ? (
                                      <div className="space-y-1">
                                        <div className="font-medium text-xs truncate" title={slot.subject.name}>
                                          {slot.subject.code}
                                        </div>
                                        <div className="text-xs text-gray-600 truncate" title={`${slot.teacher.firstName} ${slot.teacher.lastName}`}>
                                          {slot.teacher.firstName.charAt(0)}. {slot.teacher.lastName}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {slot.room}
                                        </div>
                                        <Badge className={`text-xs ${getTypeColor(slot.type)}`}>
                                          {slot.type.charAt(0).toUpperCase()}
                                        </Badge>
                                        
                                        {/* Edit/Delete buttons */}
                                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            className="h-5 w-5 p-0"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const slotIndex = daySchedule?.timeSlots.findIndex(ts => ts._id === slot._id) || 0;
                                              handleEditSlot(section.sectionName, day, slotIndex, slot);
                                            }}
                                          >
                                            <Edit className="h-2 w-2" />
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="outline"
                                            className="h-5 w-5 p-0"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const slotIndex = daySchedule?.timeSlots.findIndex(ts => ts._id === slot._id) || 0;
                                              handleDeleteSlot(section.sectionName, day, slotIndex);
                                            }}
                                          >
                                            <Trash2 className="h-2 w-2" />
                                          </Button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="h-full flex items-center justify-center text-gray-400 group-hover:text-gray-600">
                                        <div className="text-center">
                                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Plus className="h-3 w-3 mx-auto mb-1" />
                                            <div className="text-xs">Add</div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Slot Dialog */}
        <Dialog open={!!editingSlot} onOpenChange={() => setEditingSlot(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSlot?.slot ? 'Edit Class' : 'Add New Class'}
              </DialogTitle>
              <DialogDescription>
                Configure the class details for {editingSlot?.day}.
                <br />
                <small className="text-gray-500">
                  Subjects loaded: {subjects.length} | Teachers loaded: {teachers.length}
                </small>
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Select 
                    value={slotForm.startTime}
                    onValueChange={(value) => setSlotForm({ ...slotForm, startTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Select 
                    value={slotForm.endTime}
                    onValueChange={(value) => setSlotForm({ ...slotForm, endTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select 
                  value={slotForm.subject}
                  onValueChange={(value) => setSlotForm({ ...slotForm, subject: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.length > 0 ? (
                      subjects.map((subject: any) => (
                        <SelectItem key={subject._id} value={subject._id}>
                          {subject.name} ({subject.code})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        No subjects available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="teacher">Teacher</Label>
                <Select 
                  value={slotForm.teacher}
                  onValueChange={(value) => setSlotForm({ ...slotForm, teacher: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher: any) => (
                      <SelectItem key={teacher._id} value={teacher._id}>
                        {teacher.firstName} {teacher.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="room">Room</Label>
                  <Input
                    id="room"
                    value={slotForm.room}
                    onChange={(e) => setSlotForm({ ...slotForm, room: e.target.value })}
                    placeholder="e.g., CS-101"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select 
                    value={slotForm.type}
                    onValueChange={(value) => setSlotForm({ ...slotForm, type: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lecture">Lecture</SelectItem>
                      <SelectItem value="lab">Lab</SelectItem>
                      <SelectItem value="tutorial">Tutorial</SelectItem>
                      <SelectItem value="break">Break</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingSlot(null)}>Cancel</Button>
              <Button onClick={handleSaveSlot}>Save Class</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Section Dialog */}
        <Dialog open={showAddSectionDialog} onOpenChange={setShowAddSectionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Section</DialogTitle>
              <DialogDescription>
                Create a new section for this timetable. Each section will have its own independent schedule.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="sectionName">Section Name</Label>
                <Input
                  id="sectionName"
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="e.g., A, B, C, etc."
                  maxLength={5}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter a unique name for the section (1-5 characters)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddSectionDialog(false);
                  setNewSectionName('');
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateSection}
                disabled={!newSectionName.trim()}
              >
                Create Section
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
