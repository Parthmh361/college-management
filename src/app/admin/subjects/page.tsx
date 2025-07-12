'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import StudentAssignmentDialog from '@/components/StudentAssignmentDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  User, 
  Calendar,
  CheckCircle,
  XCircle,
  Users
} from 'lucide-react';

interface Subject {
  _id: string;
  name: string;
  code: string;
  description: string;
  credits: number;
  semester: number;
  department: string;
  academicYear: string;
  teacher?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  isActive: boolean;
  createdAt: string;
}

interface Teacher {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId: string;
  department: string;
}

interface Department {
  _id: string;
  name: string;
  code: string;
}

interface SubjectFormData {
  name: string;
  code: string;
  description: string;
  credits: number;
  semester: number;
  department: string;
  teacherId: string;
  academicYear: string;
}

const initialFormData: SubjectFormData = {
  name: '',
  code: '',
  description: '',
  credits: 3,
  semester: 1,
  department: '',
  teacherId: 'none',
  academicYear: '2024-2025'
};

export default function AdminSubjectsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState<SubjectFormData>(initialFormData);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Student assignment dialog state
  const [isStudentDialogOpen, setIsStudentDialogOpen] = useState(false);
  const [selectedSubjectForStudents, setSelectedSubjectForStudents] = useState<Subject | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Check authentication and role
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

    setUser(parsedUser);
    fetchSubjects();
    fetchTeachers();
    fetchDepartments();
  }, [router, mounted]);

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/subjects', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubjects(data.data?.subjects || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError('Failed to fetch subjects');
      }
    } catch (error) {
      setError('Failed to fetch subjects');
    } finally {
      setLoading(false);
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
        setTeachers(data.data?.users || []);
      }
    } catch (error) {
      // Teachers list is optional, don't break the page
    }
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/departments', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      // Departments list is optional, don't break the page
    }
  };

  const handleInputChange = (field: keyof SubjectFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');
      const url = editingSubject ? `/api/subjects/${editingSubject._id}` : '/api/subjects';
      const method = editingSubject ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          teacherId: formData.teacherId === 'none' ? null : formData.teacherId
        }),
      });

      if (response.ok) {
        const message = editingSubject ? 'Subject updated successfully!' : 'Subject created successfully!';
        setSuccess(message);
        setIsDialogOpen(false);
        setEditingSubject(null);
        setFormData(initialFormData);
        fetchSubjects();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save subject');
      }
    } catch (error) {
      setError('Failed to save subject');
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      description: subject.description,
      credits: subject.credits,
      semester: subject.semester,
      department: subject.department,
      teacherId: subject.teacher?._id || 'none',
      academicYear: subject.academicYear || '2024-2025'
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (subjectId: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuccess('Subject deleted successfully!');
        fetchSubjects();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete subject');
      }
    } catch (error) {
      setError('Failed to delete subject');
    }
  };

  const openAddDialog = () => {
    setEditingSubject(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleManageStudents = (subject: Subject) => {
    setSelectedSubjectForStudents(subject);
    setIsStudentDialogOpen(true);
  };

  const handleStudentAssignmentsUpdated = () => {
    // Refresh subjects to update enrolled student counts
    fetchSubjects();
  };

  if (!mounted) {
    return null;
  }

  if (loading || !user) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2">Loading subjects...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Subject Management</h1>
            <p className="text-muted-foreground">
              Manage subjects and assign teachers
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingSubject ? 'Edit Subject' : 'Add New Subject'}
                </DialogTitle>
                <DialogDescription>
                  {editingSubject 
                    ? 'Update the subject details and teacher assignment'
                    : 'Fill in the subject details and assign a teacher'
                  }
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Subject Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Computer Science"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="code">Subject Code *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => handleInputChange('code', e.target.value)}
                      placeholder="e.g., CS101"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Subject description..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="credits">Credits</Label>
                    <Select 
                      value={formData.credits.toString()} 
                      onValueChange={(value) => handleInputChange('credits', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Credits" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Credit</SelectItem>
                        <SelectItem value="2">2 Credits</SelectItem>
                        <SelectItem value="3">3 Credits</SelectItem>
                        <SelectItem value="4">4 Credits</SelectItem>
                        <SelectItem value="5">5 Credits</SelectItem>
                        <SelectItem value="6">6 Credits</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="semester">Semester</Label>
                    <Select 
                      value={formData.semester.toString()} 
                      onValueChange={(value) => handleInputChange('semester', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                          <SelectItem key={sem} value={sem.toString()}>
                            Semester {sem}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select 
                      value={formData.department} 
                      onValueChange={(value) => handleInputChange('department', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.length === 0 ? (
                          <SelectItem value="" disabled>No departments found</SelectItem>
                        ) : (
                          departments.map(dept => (
                            <SelectItem key={dept._id || dept.code} value={dept.code}>
                              {dept.name} ({dept.code})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="academicYear">Academic Year</Label>
                    <Select 
                      value={formData.academicYear} 
                      onValueChange={(value) => handleInputChange('academicYear', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Academic Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2023-2024">2023-2024</SelectItem>
                        <SelectItem value="2024-2025">2024-2025</SelectItem>
                        <SelectItem value="2025-2026">2025-2026</SelectItem>
                        <SelectItem value="2026-2027">2026-2027</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teacher">Assign Teacher</Label>
                  <Select 
                    value={formData.teacherId} 
                    onValueChange={(value) => handleInputChange('teacherId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No teacher assigned</SelectItem>
                      {teachers.filter(teacher => teacher._id && teacher._id.trim() !== '').map(teacher => (
                        <SelectItem key={teacher._id} value={teacher._id}>
                          {teacher.firstName} {teacher.lastName} ({teacher.employeeId}) - {teacher.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <XCircle className="w-4 h-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingSubject ? 'Update Subject' : 'Create Subject'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {success && (
          <Alert>
            <CheckCircle className="w-4 h-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {error && !isDialogOpen && (
          <Alert variant="destructive">
            <XCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subjects.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned Subjects</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subjects.filter(s => s.teacher).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subjects.filter(s => !s.teacher).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teachers.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Subjects Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Subjects</CardTitle>
            <CardDescription>
              Manage all subjects and their teacher assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2">Loading subjects...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="text-red-500">{error}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Academic Year</TableHead>
                      <TableHead>Assigned Teacher</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          No subjects found. Create your first subject!
                        </TableCell>
                      </TableRow>
                    ) : (
                      subjects.map((subject) => (
                        <TableRow key={subject._id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{subject.name}</div>
                              {subject.description && (
                                <div className="text-sm text-muted-foreground">
                                  {subject.description.length > 50 
                                    ? `${subject.description.substring(0, 50)}...`
                                    : subject.description
                                  }
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{subject.code}</Badge>
                          </TableCell>
                          <TableCell>{subject.department}</TableCell>
                          <TableCell>{subject.credits}</TableCell>
                          <TableCell>Sem {subject.semester}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{subject.academicYear}</Badge>
                          </TableCell>
                          <TableCell>
                            {subject.teacher ? (
                              <div>
                                <div className="font-medium">{subject.teacher.firstName} {subject.teacher.lastName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {subject.teacher.email}
                                </div>
                              </div>
                            ) : (
                              <Badge variant="secondary">Not Assigned</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={subject.isActive ? "default" : "secondary"}>
                              {subject.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleManageStudents(subject)}
                                title="Manage Students"
                              >
                                <Users className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(subject)}
                                title="Edit Subject"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(subject._id)}
                                className="text-red-600 hover:text-red-700"
                                title="Delete Subject"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Student Assignment Dialog */}
        <StudentAssignmentDialog
          isOpen={isStudentDialogOpen}
          onClose={() => setIsStudentDialogOpen(false)}
          subject={selectedSubjectForStudents}
          onAssignmentsUpdated={handleStudentAssignmentsUpdated}
        />
      </div>
    </DashboardLayout>
  );
}
