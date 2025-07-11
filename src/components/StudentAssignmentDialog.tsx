'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// Using standard HTML checkbox for now
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  UserPlus,
  UserMinus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  department: string;
  semester: number;
}

interface Subject {
  _id: string;
  name: string;
  code: string;
  teacher?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface StudentAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject | null;
  onAssignmentsUpdated: () => void;
}

export default function StudentAssignmentDialog({
  isOpen,
  onClose,
  subject,
  onAssignmentsUpdated
}: StudentAssignmentDialogProps) {
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedEnrolledStudents, setSelectedEnrolledStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [departments, setDepartments] = useState<string[]>([]);
  const [semesters, setSemesters] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState('assign');

  useEffect(() => {
    if (isOpen && subject) {
      fetchEnrolledStudents();
      fetchAvailableStudents();
    }
  }, [isOpen, subject]);

  useEffect(() => {
    if (isOpen && subject) {
      fetchAvailableStudents();
    }
  }, [searchTerm, departmentFilter, semesterFilter]);

  const fetchEnrolledStudents = async () => {
    if (!subject) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/subjects/${subject._id}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEnrolledStudents(data.data.students || []);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to fetch enrolled students');
      }
    } catch (error) {
      console.error('Error fetching enrolled students:', error);
      setError('Failed to fetch enrolled students');
    }
  };

  const fetchAvailableStudents = async () => {
    if (!subject) return;

    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        subjectId: subject._id
      });

      if (searchTerm) params.append('search', searchTerm);
      if (departmentFilter !== 'all') params.append('department', departmentFilter);
      if (semesterFilter !== 'all') params.append('semester', semesterFilter);

      const response = await fetch(`/api/students/available?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableStudents(data.data.students || []);
        setDepartments(data.data.filters.departments || []);
        setSemesters(data.data.filters.semesters || []);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to fetch available students');
      }
    } catch (error) {
      console.error('Error fetching available students:', error);
      setError('Failed to fetch available students');
    }
  };

  const handleAssignStudents = async () => {
    if (!subject || selectedStudents.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/subjects/${subject._id}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentIds: selectedStudents
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message);
        setSelectedStudents([]);
        await fetchEnrolledStudents();
        await fetchAvailableStudents();
        onAssignmentsUpdated();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to assign students');
      }
    } catch (error) {
      console.error('Error assigning students:', error);
      setError('Failed to assign students');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudents = async () => {
    if (!subject || selectedEnrolledStudents.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/subjects/${subject._id}/students`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentIds: selectedEnrolledStudents
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message);
        setSelectedEnrolledStudents([]);
        await fetchEnrolledStudents();
        await fetchAvailableStudents();
        onAssignmentsUpdated();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to remove students');
      }
    } catch (error) {
      console.error('Error removing students:', error);
      setError('Failed to remove students');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelection = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudents(prev => [...prev, studentId]);
    } else {
      setSelectedStudents(prev => prev.filter(id => id !== studentId));
    }
  };

  const handleEnrolledStudentSelection = (studentId: string, checked: boolean) => {
    if (checked) {
      setSelectedEnrolledStudents(prev => [...prev, studentId]);
    } else {
      setSelectedEnrolledStudents(prev => prev.filter(id => id !== studentId));
    }
  };

  const selectAllAvailable = () => {
    setSelectedStudents(availableStudents.map(s => s._id));
  };

  const deselectAllAvailable = () => {
    setSelectedStudents([]);
  };

  const selectAllEnrolled = () => {
    setSelectedEnrolledStudents(enrolledStudents.map(s => s._id));
  };

  const deselectAllEnrolled = () => {
    setSelectedEnrolledStudents([]);
  };

  const handleClose = () => {
    setSelectedStudents([]);
    setSelectedEnrolledStudents([]);
    setSearchTerm('');
    setDepartmentFilter('all');
    setSemesterFilter('all');
    setError(null);
    setSuccess(null);
    setActiveTab('assign');
    onClose();
  };

  if (!subject) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Manage Students - {subject.name} ({subject.code})
          </DialogTitle>
          <DialogDescription>
            Assign or remove students from this subject
            {subject.teacher && (
              <span className="block mt-1">
                Teacher: {subject.teacher.firstName} {subject.teacher.lastName}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <XCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="w-4 h-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assign" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Assign Students ({availableStudents.length} available)
            </TabsTrigger>
            <TabsTrigger value="enrolled" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Enrolled Students ({enrolledStudents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assign" className="flex-1 flex flex-col space-y-4">
            {/* Search and Filters */}
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="search">Search Students</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by name, email, or student ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="department">Department</Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="semester">Semester</Label>
                <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Semesters</SelectItem>
                    {semesters.map(sem => (
                      <SelectItem key={sem} value={sem.toString()}>Sem {sem}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selection Controls */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllAvailable}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAllAvailable}>
                  Deselect All
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedStudents.length} student(s) selected
              </div>
            </div>

            {/* Available Students Table */}
            <div className="flex-1 overflow-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Semester</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No available students found
                      </TableCell>
                    </TableRow>
                  ) : (
                    availableStudents.map(student => (
                      <TableRow key={student._id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student._id)}
                            onChange={(e) => 
                              handleStudentSelection(student._id, e.target.checked)
                            }
                            className="h-4 w-4 rounded border border-gray-300"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{student.studentId}</TableCell>
                        <TableCell>{student.firstName} {student.lastName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{student.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{student.department}</Badge>
                        </TableCell>
                        <TableCell>Sem {student.semester}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Assign Button */}
            <div className="flex justify-end">
              <Button 
                onClick={handleAssignStudents}
                disabled={selectedStudents.length === 0 || loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                Assign {selectedStudents.length} Student(s)
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="enrolled" className="flex-1 flex flex-col space-y-4">
            {/* Selection Controls for Enrolled Students */}
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllEnrolled}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAllEnrolled}>
                  Deselect All
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedEnrolledStudents.length} student(s) selected
              </div>
            </div>

            {/* Enrolled Students Table */}
            <div className="flex-1 overflow-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Semester</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolledStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No students enrolled in this subject
                      </TableCell>
                    </TableRow>
                  ) : (
                    enrolledStudents.map(student => (
                      <TableRow key={student._id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedEnrolledStudents.includes(student._id)}
                            onChange={(e) => 
                              handleEnrolledStudentSelection(student._id, e.target.checked)
                            }
                            className="h-4 w-4 rounded border border-gray-300"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{student.studentId}</TableCell>
                        <TableCell>{student.firstName} {student.lastName}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{student.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{student.department}</Badge>
                        </TableCell>
                        <TableCell>Sem {student.semester}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Remove Button */}
            <div className="flex justify-end">
              <Button 
                variant="destructive"
                onClick={handleRemoveStudents}
                disabled={selectedEnrolledStudents.length === 0 || loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserMinus className="w-4 h-4" />
                )}
                Remove {selectedEnrolledStudents.length} Student(s)
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
