'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  PaginationState
} from '@tanstack/react-table';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Mail,
  Phone,
  Calendar,
  MapPin,
  UserCheck,
  UserX,
  MoreHorizontal,
  ChevronDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useAcademicStore } from '@/stores/academicStore';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'Student' | 'Teacher' | 'Admin';
  department: string;
  semester?: number;
  studentId?: string;
  employeeId?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

const columnHelper = createColumnHelper<User>();

export default function UsersManagement() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Filters
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Add User
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'Student',
    department: '',
    semester: 1,
    isActive: true,
    password: '',
  });
  const [addUserError, setAddUserError] = useState('');
  const [addUserSuccess, setAddUserSuccess] = useState('');

  // Get departments from academic store
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
    fetchUsers();
  }, [router]);

  useEffect(() => {
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
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/users?limit=1000', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data?.users || []);
      } else {
        setUsers(generateMockUsers());
      }
    } catch (error) {
      setUsers(generateMockUsers());
      setError('Failed to fetch users. Showing demo data.');
    } finally {
      setLoading(false);
    }
  };

  const generateMockUsers = (): User[] => {
    const roles: User['role'][] = ['Student', 'Teacher', 'Admin'];
    const departments = ['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology'];
    const mockUsers: User[] = [];

    for (let i = 1; i <= 50; i++) {
      const role = roles[Math.floor(Math.random() * roles.length)];
      mockUsers.push({
        _id: `user_${i}`,
        firstName: `First${i}`,
        lastName: `Last${i}`,
        email: `user${i}@college.edu`,
        role,
        department: departments[Math.floor(Math.random() * departments.length)],
        semester: role === 'Student' ? Math.floor(Math.random() * 8) + 1 : undefined,
        studentId: role === 'Student' ? `STU${i.toString().padStart(4, '0')}` : undefined,
        employeeId: role === 'Teacher' ? `EMP${i.toString().padStart(4, '0')}` : undefined,
        phone: `+1234567${i.toString().padStart(3, '0')}`,
        dateOfBirth: `199${Math.floor(Math.random() * 10)}-0${Math.floor(Math.random() * 9) + 1}-${Math.floor(Math.random() * 28) + 1}`,
        address: `${i} College Street, University City`,
        isActive: Math.random() > 0.1,
        createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        lastLogin: Math.random() > 0.3 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      });
    }
    return mockUsers;
  };

  const columns = useMemo<ColumnDef<User>[]>(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'firstName',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="hover:bg-transparent p-0 font-semibold"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <div className="font-medium">
            {row.original.firstName} {row.original.lastName}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="hover:bg-transparent p-0 font-semibold"
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.original.role;
        return (
          <Badge 
            variant={role === 'Admin' ? 'destructive' : role === 'Teacher' ? 'default' : 'secondary'}
          >
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'department',
      header: 'Department',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.department}</span>
        </div>
      ),
    },
    {
      accessorKey: 'studentId',
      header: 'ID',
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.studentId || row.original.employeeId || 'N/A'}
        </span>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm">{row.original.phone || 'N/A'}</span>
        </div>
      ),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'outline' : 'secondary'}>
          {row.original.isActive ? (
            <>
              <UserCheck className="h-3 w-3 mr-1" />
              Active
            </>
          ) : (
            <>
              <UserX className="h-3 w-3 mr-1" />
              Inactive
            </>
          )}
        </Badge>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="hover:bg-transparent p-0 font-semibold"
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewUser(row.original._id)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditUser(row.original._id)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit User
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleToggleStatus(row.original._id)}
              className={row.original.isActive ? "text-yellow-600" : "text-green-600"}
            >
              {row.original.isActive ? (
                <>
                  <UserX className="mr-2 h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Activate
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleDeleteUser(row.original._id)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ], []);

  const filteredUsers = useMemo(() => {
    if (!users || !Array.isArray(users)) {
      return [];
    }
    
    return users.filter(user => {
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive);
      const matchesDepartment = departmentFilter === 'all' || user.department === departmentFilter;
      
      return matchesRole && matchesStatus && matchesDepartment;
    });
  }, [users, roleFilter, statusFilter, departmentFilter]);

  const table = useReactTable({
    data: filteredUsers,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
      globalFilter,
    },
  });

  const handleViewUser = (userId: string) => {
    console.log('View user:', userId);
  };

  const handleEditUser = (userId: string) => {
    console.log('Edit user:', userId);
  };

  const handleToggleStatus = (userId: string) => {
    console.log('Toggle status for user:', userId);
  };

  const handleDeleteUser = (userId: string) => {
    console.log('Delete user:', userId);
  };

  const handleBulkAction = (action: string) => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    console.log(`${action} for users:`, selectedRows.map(row => row.original._id));
  };

  // Add User Handler
  const handleAddUserInput = (field: string, value: string | number | boolean) => {
    setAddUserForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserError('');
    setAddUserSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(addUserForm),
      });
      if (res.ok) {
        setAddUserSuccess('User added successfully!');
        setIsAddDialogOpen(false);
        setAddUserForm({
          firstName: '',
          lastName: '',
          email: '',
          role: 'Student',
          department: '',
          semester: 1,
          isActive: true,
          password: '',
        });
        fetchUsers();
      } else {
        const data = await res.json();
        setAddUserError(data.error || 'Failed to add user');
      }
    } catch (err) {
      setAddUserError('Failed to add user');
    }
  };

  if (loading) {
    return (
      <DashboardLayout user={currentUser}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Users className="h-8 w-8 animate-pulse mx-auto mb-4" />
            <p>Loading users...</p>
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
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Manage students, teachers, and administrators
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => handleBulkAction('export')}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-full sm:max-w-lg md:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Fill in the details to add a new user.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium">First Name</label>
                      <Input
                        value={addUserForm.firstName}
                        onChange={e => handleAddUserInput('firstName', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Last Name</label>
                      <Input
                        value={addUserForm.lastName}
                        onChange={e => handleAddUserInput('lastName', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={addUserForm.email}
                      onChange={e => handleAddUserInput('email', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Password</label>
                    <Input
                      type="password"
                      value={addUserForm.password}
                      onChange={e => handleAddUserInput('password', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Role</label>
                    <Select value={addUserForm.role} onValueChange={v => handleAddUserInput('role', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Student">Student</SelectItem>
                        <SelectItem value="Teacher">Teacher</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Department</label>
                    <Select
                      value={addUserForm.department || "none"}
                      onValueChange={v => handleAddUserInput('department', v === "none" ? "" : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {departments && Array.isArray(departments) && departments.length > 0
                          ? departments
                              .filter(
                                (dept, idx, arr) =>
                                  dept &&
                                  dept.code &&
                                  arr.findIndex(d => d.code === dept.code) === idx
                              )
                              .map(dept => (
                                <SelectItem key={dept.code} value={dept.code}>
                                  {dept.name} ({dept.code})
                                </SelectItem>
                              ))
                          : (
                            <SelectItem value="no-departments" disabled>
                              No departments found
                            </SelectItem>
                          )}
                      </SelectContent>
                    </Select>
                  </div>
                  {addUserForm.role === 'Student' && (
                    <div>
                      <label className="text-sm font-medium">Semester</label>
                      <Select value={addUserForm.semester.toString()} onValueChange={v => handleAddUserInput('semester', Number(v))}>
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
                  )}
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select value={addUserForm.isActive ? 'active' : 'inactive'} onValueChange={v => handleAddUserInput('isActive', v === 'active')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {addUserError && (
                    <Alert variant="destructive">
                      <AlertDescription>{addUserError}</AlertDescription>
                    </Alert>
                  )}
                  {addUserSuccess && (
                    <Alert>
                      <AlertDescription>{addUserSuccess}</AlertDescription>
                    </Alert>
                  )}
                  <div className="flex justify-end">
                    <Button type="submit">Add User</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {error && (
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 min-w-0">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <label className="text-sm font-medium">Role</label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="Student">Students</SelectItem>
                    <SelectItem value="Teacher">Teachers</SelectItem>
                    <SelectItem value="Admin">Administrators</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-0">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-0">
                <label className="text-sm font-medium">Department</label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments && Array.isArray(departments) && departments.length > 0
                      ? departments
                          .filter(
                            (dept, idx, arr) =>
                              dept &&
                              dept.code &&
                              arr.findIndex(d => d.code === dept.code) === idx
                          )
                          .map(dept => (
                            <SelectItem key={dept.code} value={dept.code}>
                              {dept.name} ({dept.code})
                            </SelectItem>
                          ))
                      : (
                        <SelectItem value="no-departments" disabled>
                          No departments found
                        </SelectItem>
                      )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {Object.keys(rowSelection).length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">
                  {Object.keys(rowSelection).length} user(s) selected
                </span>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkAction('activate')}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Activate
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleBulkAction('deactivate')}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Deactivate
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleBulkAction('delete')}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
            <CardDescription>
              Complete list of all users in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id} className="font-semibold">
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                          <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                            className="hover:bg-muted/50"
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            className="h-24 text-center"
                          >
                            No users found.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0 space-x-0 md:space-x-6 py-4">
              <div className="flex-1 text-sm text-muted-foreground">
                {Object.keys(rowSelection).length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </div>
              <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium">Rows per page</p>
                  <Select
                    value={`${table.getState().pagination.pageSize}`}
                    onValueChange={(value) => {
                      table.setPageSize(Number(value))
                    }}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder={table.getState().pagination.pageSize} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[10, 20, 30, 40, 50].map((pageSize) => (
                        <SelectItem key={pageSize} value={`${pageSize}`}>
                          {pageSize}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                  Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {table.getPageCount()}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
