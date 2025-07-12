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
  GraduationCap, 
  Users, 
  Building, 
  Plus, 
  Edit, 
  Trash2, 
  UserPlus,
  BookOpen,
  Settings,
  Calendar,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Department {
  _id: string;
  name: string;
  code: string;
  semesters: number[];
  sections: string[];
  students: any[];
}

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  department: string;
  semester: number;
  section: string;
  isActive: boolean;
}

interface SemesterData {
  semester: number;
  sections: string[];
  studentCount: number;
}

export default function AdminManagementPage() {
  const router = useRouter();
  const [initializing, setInitializing] = useState(true);
  const { user, token, isAuthenticated, setLoading } = useAuthStore();
  const { 
    departments, 
    students, 
    loading: academicLoading, 
    error,
    setDepartments, 
    setStudents, 
    setLoading: setAcademicLoading,
    setError,
    clearError
  } = useAcademicStore();

  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  
  // Dialog states
  const [showAddDepartmentDialog, setShowAddDepartmentDialog] = useState(false);
  const [showEditDepartmentDialog, setShowEditDepartmentDialog] = useState(false);
  const [showAddSemesterDialog, setShowAddSemesterDialog] = useState(false);
  const [showAddSectionDialog, setShowAddSectionDialog] = useState(false);
  const [showAddStudentDialog, setShowAddStudentDialog] = useState(false);
  const [showEditStudentDialog, setShowEditStudentDialog] = useState(false);
  
  // Edit states
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form states
  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    code: ''
  });

  const [semesterForm, setSemesterForm] = useState({
    department: '',
    semester: 1,
    sections: ['A']
  });

  const [sectionForm, setSectionForm] = useState({
    department: '',
    semester: 1,
    sectionName: ''
  });

  const [studentForm, setStudentForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    studentId: '',
    department: '',
    semester: 1,
    section: 'A',
    password: ''
  });

  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      // Wait for auth store to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Auth check - isAuthenticated:', isAuthenticated);
      console.log('Auth check - user:', user);
      console.log('Auth check - token:', token);
      
      setInitializing(false);
      
      // Check authentication
      if (!isAuthenticated || !user || !token) {
        console.log('Not authenticated, redirecting to login');
        router.push('/login');
        return;
      }

      if (user.role !== 'Admin') {
        console.log('Not admin, redirecting to dashboard');
        router.push('/dashboard');
        return;
      }

      console.log('Authentication passed, loading data');
      // Load academic data
      setAcademicLoading(true);
      try {
        await Promise.all([
          fetchDepartments(),
          fetchStudents()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load academic data');
      } finally {
        setAcademicLoading(false);
      }
    };

    checkAuth();
  }, [isAuthenticated, user, token, router, setAcademicLoading, setError]);
  const fetchDepartments = async () => {
    try {
      setAcademicLoading(true); // Use setAcademicLoading instead of setLoading
      clearError();
      
      const response = await fetch('/api/admin/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Departments API response:', data);
        
        // The API returns { message: "...", departments: [...] }
        const departmentsList = data.departments || [];
        console.log('Setting departments in store:', departmentsList);
        
        setDepartments(departmentsList);
      } else {
        const errorData = await response.json();
        console.error('Departments API error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch departments');
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      setError('Failed to fetch departments');
      setDepartments([]); // Ensure it's always an array
    } finally {
      setAcademicLoading(false); // Use setAcademicLoading instead of setLoading
    }
  };
  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/admin/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      } else {
        throw new Error('Failed to fetch students');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to fetch students');
    }
  };

  const handleCreateDepartment = async () => {
    try {
      clearError();
      
      // Validation
      if (!departmentForm.name.trim() || !departmentForm.code.trim()) {
        setAlert({ type: 'error', message: 'Department name and code are required' });
        return;
      }

      // Check if department already exists
      const existingDept = departments && departments.length > 0 ? departments.find(d => {
        if (!d || typeof d !== 'object') return false;
        const deptCode = d.code ? d.code.toLowerCase() : '';
        const deptName = d.name ? d.name.toLowerCase() : '';
        const formCode = departmentForm.code ? departmentForm.code.toLowerCase() : '';
        const formName = departmentForm.name ? departmentForm.name.toLowerCase() : '';
        return (deptCode && deptCode === formCode) || (deptName && deptName === formName);
      }) : null;
      
      if (existingDept) {
        setAlert({ type: 'error', message: 'Department with this name or code already exists' });
        return;
      }

      console.log('Creating department:', departmentForm);
      console.log('Using token:', token);

      const response = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(departmentForm)
      });

      console.log('Create department response status:', response.status);
      console.log('Create department response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Create department success data:', data);
        
        setAlert({ type: 'success', message: 'Department created successfully' });
        setShowAddDepartmentDialog(false);
        setDepartmentForm({ name: '', code: '' });
        
        // Refetch departments to get the updated list
        console.log('Refetching departments after creation...');
        await fetchDepartments();
      } else {
        const errorData = await response.json();
        console.error('Create department error:', errorData);
        setAlert({ type: 'error', message: errorData.error || 'Failed to create department' });
      }
    } catch (error) {
      console.error('Error creating department:', error);
      setAlert({ type: 'error', message: 'Network error: Failed to create department' });
    }
  };

  const handleAddSemester = async () => {
    // Validation
    if (!semesterForm.department) {
      setAlert({ type: 'error', message: 'Please select a department' });
      return;
    }

    // Check if semester already exists in department
    const dept = departments.find(d => d.code === semesterForm.department);
    if (dept && dept.semesters.includes(semesterForm.semester)) {
      setAlert({ type: 'error', message: 'Semester already exists in this department' });
      return;
    }

    try {
      const response = await fetch('/api/admin/departments/semester', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(semesterForm)
      });

      if (response.ok) {
        setAlert({ type: 'success', message: 'Semester added successfully' });
        setShowAddSemesterDialog(false);
        setSemesterForm({ department: '', semester: 1, sections: ['A'] });
        await fetchDepartments();
      } else {
        const error = await response.json();
        setAlert({ type: 'error', message: error.error || 'Failed to add semester' });
      }
    } catch (error) {
      console.error('Error adding semester:', error);
      setAlert({ type: 'error', message: 'Failed to add semester' });
    }
  };

  const handleAddSection = async () => {
    // Validation
    if (!sectionForm.department || !sectionForm.sectionName.trim()) {
      setAlert({ type: 'error', message: 'Department and section name are required' });
      return;
    }

    // Validate section name format (single letter)
    if (!/^[A-Z]$/.test(sectionForm.sectionName)) {
      setAlert({ type: 'error', message: 'Section name must be a single uppercase letter' });
      return;
    }

    // Check if section already exists
    const dept = departments.find(d => d.code === sectionForm.department);
    if (dept && dept.sections.includes(sectionForm.sectionName)) {
      setAlert({ type: 'error', message: 'Section already exists in this department' });
      return;
    }

    try {
      const response = await fetch('/api/admin/departments/section', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sectionForm)
      });

      if (response.ok) {
        setAlert({ type: 'success', message: 'Section added successfully' });
        setShowAddSectionDialog(false);
        setSectionForm({ department: '', semester: 1, sectionName: '' });
        await fetchDepartments();
      } else {
        const error = await response.json();
        setAlert({ type: 'error', message: error.error || 'Failed to add section' });
      }
    } catch (error) {
      console.error('Error adding section:', error);
      setAlert({ type: 'error', message: 'Failed to add section' });
    }
  };

  const handleCreateStudent = async () => {
    // Validation
    const { firstName, lastName, email, studentId, department, semester, section, password } = studentForm;
    
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !studentId.trim() || 
        !department || !section || !password) {
      setAlert({ type: 'error', message: 'All fields are required' });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAlert({ type: 'error', message: 'Please enter a valid email address' });
      return;
    }

    // Password validation
    if (password.length < 6) {
      setAlert({ type: 'error', message: 'Password must be at least 6 characters long' });
      return;
    }

    // Check if student ID or email already exists
    const existingStudent = students && students.length > 0 ? students.find(s => {
      if (!s || typeof s !== 'object') return false;
      const studentEmail = s.email ? s.email.toLowerCase() : '';
      const formEmail = email ? email.toLowerCase() : '';
      return (s.studentId && s.studentId === studentId) || (studentEmail && studentEmail === formEmail);
    }) : null;
    if (existingStudent) {
      setAlert({ 
        type: 'error', 
        message: existingStudent.studentId === studentId ? 
          'Student ID already exists' : 'Email already exists' 
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(studentForm)
      });

      if (response.ok) {
        setAlert({ type: 'success', message: 'Student created successfully' });
        setShowAddStudentDialog(false);
        setStudentForm({
          firstName: '',
          lastName: '',
          email: '',
          studentId: '',
          department: '',
          semester: 1,
          section: 'A',
          password: ''
        });
        await fetchStudents();
      } else {
        const error = await response.json();
        setAlert({ type: 'error', message: error.error || 'Failed to create student' });
      }
    } catch (error) {
      console.error('Error creating student:', error);
      setAlert({ type: 'error', message: 'Failed to create student' });
    }
  };

  // Edit Department Functions
  const handleEditDepartment = (dept: Department) => {
    setEditingDepartment(dept);
    setDepartmentForm({ 
      name: dept.name || '', 
      code: dept.code || '' 
    });
    setShowEditDepartmentDialog(true);
  };

  const handleUpdateDepartment = async () => {
    if (!editingDepartment) return;

    // Validation
    if (!departmentForm.name.trim() || !departmentForm.code.trim()) {
      setAlert({ type: 'error', message: 'Department name and code are required' });
      return;
    }

    // Check for duplicates (excluding current department)
    const existingDept = departments && departments.length > 0 ? departments.find(d => {
      if (!d || typeof d !== 'object' || !d._id || d._id === editingDepartment._id) return false;
      const deptCode = d.code ? d.code.toLowerCase() : '';
      const deptName = d.name ? d.name.toLowerCase() : '';
      const formCode = departmentForm.code ? departmentForm.code.toLowerCase() : '';
      const formName = departmentForm.name ? departmentForm.name.toLowerCase() : '';
      return (deptCode && deptCode === formCode) || (deptName && deptName === formName);
    }) : null;
    if (existingDept) {
      setAlert({ 
        type: 'error', 
        message: (existingDept.name && existingDept.name.toLowerCase() === departmentForm.name.toLowerCase()) ? 
          'Department name already exists' : 'Department code already exists' 
      });
      return;
    }

    try {
      const response = await fetch(`/api/admin/departments/${editingDepartment._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(departmentForm)
      });

      if (response.ok) {
        setAlert({ type: 'success', message: 'Department updated successfully' });
        setShowEditDepartmentDialog(false);
        setEditingDepartment(null);
        setDepartmentForm({ name: '', code: '' });
        await fetchDepartments();
      } else {
        const error = await response.json();
        setAlert({ type: 'error', message: error.error || 'Failed to update department' });
      }
    } catch (error) {
      console.error('Error updating department:', error);
      setAlert({ type: 'error', message: 'Failed to update department' });
    }
  };

  const handleDeleteDepartment = async (deptId: string) => {
    if (!confirm('Are you sure you want to delete this department? This will also remove all associated students.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/departments/${deptId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setAlert({ type: 'success', message: 'Department deleted successfully' });
        await Promise.all([fetchDepartments(), fetchStudents()]);
      } else {
        const error = await response.json();
        setAlert({ type: 'error', message: error.error || 'Failed to delete department' });
      }
    } catch (error) {
      console.error('Error deleting department:', error);
      setAlert({ type: 'error', message: 'Failed to delete department' });
    }
  };

  // Edit Student Functions
  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setStudentForm({
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      email: student.email || '',
      studentId: student.studentId || '',
      department: student.department || '',
      semester: student.semester || 1,
      section: student.section || 'A',
      password: '' // Don't pre-fill password for security
    });
    setShowEditStudentDialog(true);
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent) return;

    // Validation
    const { firstName, lastName, email, studentId, department, semester, section } = studentForm;
    
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !studentId.trim() || 
        !department || !section) {
      setAlert({ type: 'error', message: 'All fields except password are required' });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAlert({ type: 'error', message: 'Please enter a valid email address' });
      return;
    }

    // Password validation (only if provided)
    if (studentForm.password && studentForm.password.length < 6) {
      setAlert({ type: 'error', message: 'Password must be at least 6 characters long' });
      return;
    }

    // Check for duplicates (excluding current student)
    const existingStudent = students && students.length > 0 ? students.find(s => {
      if (!s || typeof s !== 'object' || !s._id || s._id === editingStudent._id) return false;
      const studentEmail = s.email ? s.email.toLowerCase() : '';
      const formEmail = email ? email.toLowerCase() : '';
      return (s.studentId && s.studentId === studentId) || (studentEmail && studentEmail === formEmail);
    }) : null;
    if (existingStudent) {
      setAlert({ 
        type: 'error', 
        message: existingStudent.studentId === studentId ? 
          'Student ID already exists' : 'Email already exists' 
      });
      return;
    }

    try {
      const { password, ...otherData } = studentForm;
      const updateData: any = { ...otherData };
      
      // Only include password if it's provided
      if (password && password.trim()) {
        updateData.password = password;
      }

      const response = await fetch(`/api/admin/students/${editingStudent._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        setAlert({ type: 'success', message: 'Student updated successfully' });
        setShowEditStudentDialog(false);
        setEditingStudent(null);
        setStudentForm({
          firstName: '',
          lastName: '',
          email: '',
          studentId: '',
          department: '',
          semester: 1,
          section: 'A',
          password: ''
        });
        await fetchStudents();
      } else {
        const error = await response.json();
        setAlert({ type: 'error', message: error.error || 'Failed to update student' });
      }
    } catch (error) {
      console.error('Error updating student:', error);
      setAlert({ type: 'error', message: 'Failed to update student' });
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to delete this student?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setAlert({ type: 'success', message: 'Student deleted successfully' });
        await fetchStudents();
      } else {
        const error = await response.json();
        setAlert({ type: 'error', message: error.error || 'Failed to delete student' });
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      setAlert({ type: 'error', message: 'Failed to delete student' });
    }
  };

  const getDepartmentSemesters = (departmentCode: string): SemesterData[] => {
    const dept = departments.find(d => d.code === departmentCode);
    if (!dept) return [];

    return dept.semesters.map(sem => ({
      semester: sem,
      sections: dept.sections.filter((_, index) => index < 5), // Assuming max 5 sections per semester
      studentCount: students.filter(s => s.department === departmentCode && s.semester === sem).length
    }));
  };

  const getFilteredStudents = () => {
    if (!students || !Array.isArray(students)) return [];
    return students.filter(student => {
      if (!student || typeof student !== 'object') return false;
      if (selectedDepartment && student.department !== selectedDepartment) return false;
      if (selectedSemester && student.semester !== selectedSemester) return false;
      return true;
    });
  };

if (initializing || academicLoading) {
  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Settings className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>{initializing ? 'Initializing...' : 'Loading management panel...'}</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Academic Management</h1>
            <p className="text-gray-600">Manage departments, semesters, sections, and students</p>
          </div>
        </div>

        {alert && (
          <Alert className={alert.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
            {alert.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="semesters">Semesters & Sections</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{departments.length}</div>
                  <p className="text-xs text-muted-foreground">Active departments</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{students.length}</div>
                  <p className="text-xs text-muted-foreground">Enrolled students</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Semesters</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {departments.reduce((total, dept) => total + dept.semesters.length, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Across all departments</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Department Overview</CardTitle>
                  <CardDescription>Current departments and their structure</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {departments.map(dept => (
                      <div key={dept._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{dept.name}</div>
                          <div className="text-sm text-gray-500">Code: {dept.code}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{dept.semesters.length} Semesters</div>
                          <div className="text-xs text-gray-500">{dept.sections.length} Sections</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Statistics</CardTitle>
                  <CardDescription>Latest enrollment data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {departments.slice(0, 5).map(dept => {
                      const deptStudents = students.filter(s => s.department === dept.code);
                      return (
                        <div key={dept._id} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{dept.code}</span>
                          <Badge variant="outline">{deptStudents.length} students</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="departments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Department Management</h2>
              <Button onClick={() => setShowAddDepartmentDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Department
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments && departments.filter(dept => dept && dept._id).map(dept => (
                <Card key={dept._id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{dept.name || 'No Name'}</CardTitle>
                        <CardDescription>Code: {dept.code || 'No Code'}</CardDescription>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditDepartment(dept)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteDepartment(dept._id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Semesters:</span>
                        <span className="text-sm font-medium">{dept.semesters.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Sections:</span>
                        <span className="text-sm font-medium">{dept.sections.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Students:</span>
                        <span className="text-sm font-medium">
                          {students.filter(s => s.department === dept.code).length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="semesters" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Semester & Section Management</h2>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setShowAddSemesterDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Semester
                </Button>
                <Button onClick={() => setShowAddSectionDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Section
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              {departments.map(dept => (
                <Card key={dept._id}>
                  <CardHeader>
                    <CardTitle>{dept.name} ({dept.code})</CardTitle>
                    <CardDescription>Semester and section structure</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {dept.semesters.map(sem => {
                        const semStudents = students.filter(s => s.department === dept.code && s.semester === sem);
                        return (
                          <div key={sem} className="border rounded-lg p-3">
                            <div className="font-medium mb-2">Semester {sem}</div>
                            <div className="text-sm text-gray-600 mb-2">{semStudents.length} students</div>
                            <div className="flex flex-wrap gap-1">
                              {dept.sections.map(section => (
                                <Badge key={section} variant="outline" className="text-xs">
                                  {section}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Student Management</h2>
              <Button onClick={() => setShowAddStudentDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </div>

            <div className="flex space-x-4 mb-4">
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept._id} value={dept.code}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSemester?.toString() || ''} onValueChange={(value) => setSelectedSemester(value ? parseInt(value) : null)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Semesters</SelectItem>
                  {[1,2,3,4,5,6,7,8].map(sem => (
                    <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredStudents().map(student => (
                      <TableRow key={student._id || 'unknown'}>
                        <TableCell className="font-medium">{student.studentId || 'N/A'}</TableCell>
                        <TableCell>{(student.firstName || '') + ' ' + (student.lastName || '')}</TableCell>
                        <TableCell>{student.email || 'N/A'}</TableCell>
                        <TableCell>{student.department || 'N/A'}</TableCell>
                        <TableCell>{student.semester || 'N/A'}</TableCell>
                        <TableCell>{student.section || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge variant={student.isActive ? "default" : "secondary"}>
                            {student.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditStudent(student)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleDeleteStudent(student._id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Department Dialog */}
        <Dialog open={showAddDepartmentDialog} onOpenChange={setShowAddDepartmentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Department</DialogTitle>
              <DialogDescription>Create a new department for the college</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="deptName">Department Name</Label>
                <Input
                  id="deptName"
                  value={departmentForm.name || ''}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                  placeholder="e.g., Computer Science"
                />
              </div>
              <div>
                <Label htmlFor="deptCode">Department Code</Label>
                <Input
                  id="deptCode"
                  value={departmentForm.code || ''}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., CS"
                  maxLength={5}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDepartmentDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateDepartment}>Create Department</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Semester Dialog */}
        <Dialog open={showAddSemesterDialog} onOpenChange={setShowAddSemesterDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Semester</DialogTitle>
              <DialogDescription>Add a new semester to a department</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="semDept">Department</Label>
                <Select 
                  value={semesterForm.department || ''}
                  onValueChange={(value) => setSemesterForm({ ...semesterForm, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept._id} value={dept.code}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="semNum">Semester Number</Label>
                <Select 
                  value={semesterForm.semester.toString()}
                  onValueChange={(value) => setSemesterForm({ ...semesterForm, semester: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8].map(sem => (
                      <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Initial Sections</Label>
                <div className="text-sm text-gray-500">Sections A, B, C will be created by default</div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddSemesterDialog(false)}>Cancel</Button>
              <Button onClick={handleAddSemester}>Add Semester</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Section Dialog */}
        <Dialog open={showAddSectionDialog} onOpenChange={setShowAddSectionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Section</DialogTitle>
              <DialogDescription>Add a new section to a semester</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="secDept">Department</Label>
                <Select 
                  value={sectionForm.department || ''}
                  onValueChange={(value) => setSectionForm({ ...sectionForm, department: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept._id} value={dept.code}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="secSem">Semester</Label>
                <Select 
                  value={sectionForm.semester.toString()}
                  onValueChange={(value) => setSectionForm({ ...sectionForm, semester: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8].map(sem => (
                      <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="secName">Section Name</Label>
                <Input
                  id="secName"
                  value={sectionForm.sectionName || ''}
                  onChange={(e) => setSectionForm({ ...sectionForm, sectionName: e.target.value.toUpperCase() })}
                  placeholder="e.g., D"
                  maxLength={1}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddSectionDialog(false)}>Cancel</Button>
              <Button onClick={handleAddSection}>Add Section</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Student Dialog */}
        <Dialog open={showAddStudentDialog} onOpenChange={setShowAddStudentDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
              <DialogDescription>Create a new student account</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stuFirstName">First Name</Label>
                  <Input
                    id="stuFirstName"
                    value={studentForm.firstName || ''}
                    onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                    placeholder="First name"
                  />
                </div>
                <div>
                  <Label htmlFor="stuLastName">Last Name</Label>
                  <Input
                    id="stuLastName"
                    value={studentForm.lastName || ''}
                    onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                    placeholder="Last name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stuEmail">Email</Label>
                  <Input
                    id="stuEmail"
                    type="email"
                    value={studentForm.email || ''}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    placeholder="student@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="stuId">Student ID</Label>
                  <Input
                    id="stuId"
                    value={studentForm.studentId || ''}
                    onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })}
                    placeholder="e.g., 2024CS001"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="stuDept">Department</Label>
                  <Select 
                    value={studentForm.department || ''}
                    onValueChange={(value) => setStudentForm({ ...studentForm, department: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept._id} value={dept.code}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="stuSem">Semester</Label>
                  <Select 
                    value={studentForm.semester.toString()}
                    onValueChange={(value) => setStudentForm({ ...studentForm, semester: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7,8].map(sem => (
                        <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="stuSec">Section</Label>
                  <Select 
                    value={studentForm.section || 'A'}
                    onValueChange={(value) => setStudentForm({ ...studentForm, section: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['A', 'B', 'C', 'D', 'E'].map(sec => (
                        <SelectItem key={sec} value={sec}>Section {sec}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="stuPassword">Temporary Password</Label>
                <Input
                  id="stuPassword"
                  type="password"
                  value={studentForm.password || ''}
                  onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                  placeholder="Temporary password for student"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddStudentDialog(false)}>Cancel</Button>
              <Button onClick={handleCreateStudent}>Create Student</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Department Dialog */}
        <Dialog open={showEditDepartmentDialog} onOpenChange={setShowEditDepartmentDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Department</DialogTitle>
              <DialogDescription>
                Update the department information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editDeptName">Department Name</Label>
                <Input
                  id="editDeptName"
                  value={departmentForm.name || ''}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                  placeholder="e.g., Computer Science"
                />
              </div>
              <div>
                <Label htmlFor="editDeptCode">Department Code</Label>
                <Input
                  id="editDeptCode"
                  value={departmentForm.code || ''}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, code: e.target.value })}
                  placeholder="e.g., CS"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowEditDepartmentDialog(false);
                setEditingDepartment(null);
                setDepartmentForm({ name: '', code: '' });
              }}>Cancel</Button>
              <Button onClick={handleUpdateDepartment}>Update Department</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Student Dialog */}
        <Dialog open={showEditStudentDialog} onOpenChange={setShowEditStudentDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Student</DialogTitle>
              <DialogDescription>
                Update student information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editStuFirstName">First Name</Label>
                  <Input
                    id="editStuFirstName"
                    value={studentForm.firstName || ''}
                    onChange={(e) => setStudentForm({ ...studentForm, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="editStuLastName">Last Name</Label>
                  <Input
                    id="editStuLastName"
                    value={studentForm.lastName || ''}
                    onChange={(e) => setStudentForm({ ...studentForm, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="editStuEmail">Email</Label>
                <Input
                  id="editStuEmail"
                  type="email"
                  value={studentForm.email || ''}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="editStuId">Student ID</Label>
                <Input
                  id="editStuId"
                  value={studentForm.studentId || ''}
                  onChange={(e) => setStudentForm({ ...studentForm, studentId: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="editStuDept">Department</Label>
                  <Select value={studentForm.department || ''} onValueChange={(value) => setStudentForm({ ...studentForm, department: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept._id} value={dept.code}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editStuSem">Semester</Label>
                  <Select value={studentForm.semester.toString()} onValueChange={(value) => setStudentForm({ ...studentForm, semester: parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1,2,3,4,5,6,7,8].map(sem => (
                        <SelectItem key={sem} value={sem.toString()}>{sem}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editStuSec">Section</Label>
                  <Select value={studentForm.section || 'A'} onValueChange={(value) => setStudentForm({ ...studentForm, section: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['A', 'B', 'C', 'D', 'E'].map(sec => (
                        <SelectItem key={sec} value={sec}>{sec}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="editStuPassword">New Password (leave blank to keep current)</Label>
                <Input
                  id="editStuPassword"
                  type="password"
                  value={studentForm.password || ''}
                  onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                  placeholder="New password (optional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowEditStudentDialog(false);
                setEditingStudent(null);
                setStudentForm({
                  firstName: '',
                  lastName: '',
                  email: '',
                  studentId: '',
                  department: '',
                  semester: 1,
                  section: 'A',
                  password: ''
                });
              }}>Cancel</Button>
              <Button onClick={handleUpdateStudent}>Update Student</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
