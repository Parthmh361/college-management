'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Upload, 
  Download, 
  Users, 
  BookOpen, 
  Mail, 
  Trash2,
  CheckCircle,
  AlertTriangle,
  Info,
  RefreshCw,
  Play,
  Pause,
  FileText,
  UserPlus,
  UserMinus,
  Settings,
  Clock
} from 'lucide-react';

interface BulkOperation {
  id: string;
  type: 'import' | 'export' | 'delete' | 'update' | 'notify';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  description: string;
  startTime: string;
  endTime?: string;
  recordsProcessed: number;
  totalRecords: number;
  errors: string[];
}

export default function BulkOperationsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [operations, setOperations] = useState<BulkOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Import/Export states
  const [importFile, setImportFile] = useState<File | null>(null);
  const [exportType, setExportType] = useState('users');
  const [exportFormat, setExportFormat] = useState('csv');

  // Bulk update states
  const [updateCriteria, setUpdateCriteria] = useState({
    userType: 'all',
    department: 'all',
    status: 'all'
  });
  const [updateFields, setUpdateFields] = useState({
    department: '',
    status: '',
    semester: ''
  });

  // Notification states
  const [notificationData, setNotificationData] = useState({
    recipients: 'all',
    subject: '',
    message: '',
    type: 'email'
  });

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
    fetchOperations();
  }, [router]);

  const fetchOperations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/bulk-operations', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOperations(data.operations);
      } else {
        // Mock data for demo
        setOperations(generateMockOperations());
      }
    } catch (error) {
      console.error('Error fetching operations:', error);
      setOperations(generateMockOperations());
    } finally {
      setLoading(false);
    }
  };

  const generateMockOperations = (): BulkOperation[] => {
    return [
      {
        id: '1',
        type: 'import',
        status: 'completed',
        progress: 100,
        description: 'Import 150 student records from CSV',
        startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
        recordsProcessed: 150,
        totalRecords: 150,
        errors: []
      },
      {
        id: '2',
        type: 'export',
        status: 'running',
        progress: 65,
        description: 'Export attendance reports for all subjects',
        startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        recordsProcessed: 650,
        totalRecords: 1000,
        errors: []
      },
      {
        id: '3',
        type: 'notify',
        status: 'failed',
        progress: 30,
        description: 'Send low attendance alerts to parents',
        startTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
        recordsProcessed: 15,
        totalRecords: 50,
        errors: ['SMTP server connection failed', 'Invalid email addresses found']
      }
    ];
  };

  const handleImportUsers = async () => {
    if (!importFile) {
      setMessage({ type: 'error', text: 'Please select a file to import.' });
      return;
    }

    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/bulk-operations/import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Import operation started successfully!' });
        fetchOperations();
      } else {
        setMessage({ type: 'error', text: 'Failed to start import operation.' });
      }
    } catch (error) {
      console.error('Error importing users:', error);
      setMessage({ type: 'error', text: 'An error occurred during import.' });
    }
  };

  const handleExportData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/bulk-operations/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: exportType,
          format: exportFormat
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Export operation started successfully!' });
        fetchOperations();
      } else {
        setMessage({ type: 'error', text: 'Failed to start export operation.' });
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      setMessage({ type: 'error', text: 'An error occurred during export.' });
    }
  };

  const handleBulkUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/bulk-operations/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          criteria: updateCriteria,
          updates: updateFields
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Bulk update operation started successfully!' });
        fetchOperations();
      } else {
        setMessage({ type: 'error', text: 'Failed to start bulk update operation.' });
      }
    } catch (error) {
      console.error('Error updating records:', error);
      setMessage({ type: 'error', text: 'An error occurred during bulk update.' });
    }
  };

  const handleSendNotifications = async () => {
    if (!notificationData.subject || !notificationData.message) {
      setMessage({ type: 'error', text: 'Please provide subject and message for notifications.' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/bulk-operations/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(notificationData)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Notification operation started successfully!' });
        fetchOperations();
      } else {
        setMessage({ type: 'error', text: 'Failed to start notification operation.' });
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
      setMessage({ type: 'error', text: 'An error occurred while sending notifications.' });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completed</Badge>;
      case 'running':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Running</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout user={currentUser}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Database className="h-8 w-8 animate-pulse mx-auto mb-4" />
            <p>Loading bulk operations...</p>
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
            <h1 className="text-3xl font-bold tracking-tight">Bulk Operations</h1>
            <p className="text-muted-foreground">
              Perform bulk operations on users, data, and system notifications
            </p>
          </div>
          <Button variant="outline" onClick={fetchOperations}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {message && (
          <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}>
            {message.type === 'error' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : message.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <Info className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Operation Tabs */}
        <Tabs defaultValue="import-export" className="space-y-4">
          <TabsList>
            <TabsTrigger value="import-export">Import/Export</TabsTrigger>
            <TabsTrigger value="bulk-update">Bulk Update</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="history">Operation History</TabsTrigger>
          </TabsList>

          <TabsContent value="import-export" className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Import Data */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="h-5 w-5 mr-2" />
                    Import Data
                  </CardTitle>
                  <CardDescription>
                    Import users and data from CSV files
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="import-file">Select CSV File</Label>
                    <Input
                      id="import-file"
                      type="file"
                      accept=".csv"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Supported formats: CSV</p>
                    <p>Required columns: firstName, lastName, email, role</p>
                  </div>
                  <Button onClick={handleImportUsers} disabled={!importFile} className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Start Import
                  </Button>
                </CardContent>
              </Card>

              {/* Export Data */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Download className="h-5 w-5 mr-2" />
                    Export Data
                  </CardTitle>
                  <CardDescription>
                    Export system data to various formats
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="export-type">Data Type</Label>
                    <Select value={exportType} onValueChange={setExportType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="users">All Users</SelectItem>
                        <SelectItem value="students">Students Only</SelectItem>
                        <SelectItem value="teachers">Teachers Only</SelectItem>
                        <SelectItem value="attendance">Attendance Records</SelectItem>
                        <SelectItem value="subjects">Subjects</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="export-format">Format</Label>
                    <Select value={exportFormat} onValueChange={setExportFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="xlsx">Excel</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                        <SelectItem value="pdf">PDF Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleExportData} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Start Export
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bulk-update" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Bulk Update Records
                </CardTitle>
                <CardDescription>
                  Update multiple records based on criteria
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="user-type">User Type</Label>
                    <Select 
                      value={updateCriteria.userType} 
                      onValueChange={(value) => setUpdateCriteria({...updateCriteria, userType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="Student">Students</SelectItem>
                        <SelectItem value="Teacher">Teachers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select 
                      value={updateCriteria.department} 
                      onValueChange={(value) => setUpdateCriteria({...updateCriteria, department: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                        <SelectItem value="Physics">Physics</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Current Status</Label>
                    <Select 
                      value={updateCriteria.status} 
                      onValueChange={(value) => setUpdateCriteria({...updateCriteria, status: value})}
                    >
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
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3">Update Fields</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="new-department">New Department</Label>
                      <Input
                        id="new-department"
                        value={updateFields.department}
                        onChange={(e) => setUpdateFields({...updateFields, department: e.target.value})}
                        placeholder="Leave empty to skip"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-status">New Status</Label>
                      <Select 
                        value={updateFields.status} 
                        onValueChange={(value) => setUpdateFields({...updateFields, status: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No change</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-semester">New Semester</Label>
                      <Input
                        id="new-semester"
                        type="number"
                        value={updateFields.semester}
                        onChange={(e) => setUpdateFields({...updateFields, semester: e.target.value})}
                        placeholder="Leave empty to skip"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleBulkUpdate} className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Start Bulk Update
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Send Bulk Notifications
                </CardTitle>
                <CardDescription>
                  Send notifications to multiple users at once
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="recipients">Recipients</Label>
                    <Select 
                      value={notificationData.recipients} 
                      onValueChange={(value) => setNotificationData({...notificationData, recipients: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="students">All Students</SelectItem>
                        <SelectItem value="teachers">All Teachers</SelectItem>
                        <SelectItem value="parents">All Parents</SelectItem>
                        <SelectItem value="low-attendance">Low Attendance Students</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notification-type">Type</Label>
                    <Select 
                      value={notificationData.type} 
                      onValueChange={(value) => setNotificationData({...notificationData, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="push">Push Notification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notification-subject">Subject</Label>
                  <Input
                    id="notification-subject"
                    value={notificationData.subject}
                    onChange={(e) => setNotificationData({...notificationData, subject: e.target.value})}
                    placeholder="Enter notification subject"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notification-message">Message</Label>
                  <Textarea
                    id="notification-message"
                    value={notificationData.message}
                    onChange={(e) => setNotificationData({...notificationData, message: e.target.value})}
                    placeholder="Enter notification message"
                    rows={4}
                  />
                </div>
                <Button onClick={handleSendNotifications} className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Notifications
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Operation History
                </CardTitle>
                <CardDescription>
                  View the status and history of all bulk operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {operations.map((operation) => (
                    <div key={operation.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(operation.status)}
                          <div>
                            <h4 className="font-medium">{operation.description}</h4>
                            <p className="text-sm text-muted-foreground">
                              Started: {new Date(operation.startTime).toLocaleString()}
                              {operation.endTime && ` • Ended: ${new Date(operation.endTime).toLocaleString()}`}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(operation.status)}
                      </div>
                      
                      {operation.status === 'running' && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{operation.recordsProcessed} / {operation.totalRecords} records</span>
                          </div>
                          <Progress value={operation.progress} />
                        </div>
                      )}

                      {operation.errors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                          <h5 className="font-medium text-red-800 mb-2">Errors:</h5>
                          <ul className="text-sm text-red-600 space-y-1">
                            {operation.errors.map((error, index) => (
                              <li key={index}>• {error}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {operation.status === 'completed' && (
                        <div className="bg-green-50 border border-green-200 rounded p-3">
                          <p className="text-sm text-green-800">
                            Successfully processed {operation.recordsProcessed} records
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {operations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No bulk operations found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
