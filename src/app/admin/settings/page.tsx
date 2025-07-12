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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Save, 
  Shield, 
  Bell, 
  Database, 
  Mail, 
  Clock, 
  Users, 
  FileText, 
  Download,
  Upload,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

interface SystemSettings {
  general: {
    institutionName: string;
    institutionAddress: string;
    contactEmail: string;
    contactPhone: string;
    timezone: string;
    language: string;
    dateFormat: string;
  };
  attendance: {
    qrCodeExpiry: number;
    attendanceGracePeriod: number;
    autoMarkAbsent: boolean;
    attendanceThreshold: number;
    proximityRadius: number;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    lowAttendanceAlert: boolean;
    attendanceReports: boolean;
    systemMaintenance: boolean;
  };
  security: {
    passwordMinLength: number;
    passwordRequireSpecialChars: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    twoFactorAuth: boolean;
  };
  backup: {
    autoBackup: boolean;
    backupFrequency: string;
    retentionPeriod: number;
    lastBackup: string;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

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
    fetchSettings();
  }, [router]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      } else {
        // Mock settings for demo
        setSettings(generateMockSettings());
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setSettings(generateMockSettings());
    } finally {
      setLoading(false);
    }
  };

  const generateMockSettings = (): SystemSettings => {
    return {
      general: {
        institutionName: 'University College of Management',
        institutionAddress: '123 Education Street, Learning City, LC 12345',
        contactEmail: 'admin@college.edu',
        contactPhone: '+1 (555) 123-4567',
        timezone: 'America/New_York',
        language: 'en',
        dateFormat: 'MM/DD/YYYY'
      },
      attendance: {
        qrCodeExpiry: 30,
        attendanceGracePeriod: 15,
        autoMarkAbsent: true,
        attendanceThreshold: 75,
        proximityRadius: 50
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        lowAttendanceAlert: true,
        attendanceReports: true,
        systemMaintenance: true
      },
      security: {
        passwordMinLength: 8,
        passwordRequireSpecialChars: true,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        twoFactorAuth: false
      },
      backup: {
        autoBackup: true,
        backupFrequency: 'daily',
        retentionPeriod: 30,
        lastBackup: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      }
    };
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'An error occurred while saving settings.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleBackupNow = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Backup initiated successfully!' });
        if (settings) {
          setSettings({
            ...settings,
            backup: {
              ...settings.backup,
              lastBackup: new Date().toISOString()
            }
          });
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to initiate backup.' });
      }
    } catch (error) {
      console.error('Error initiating backup:', error);
      setMessage({ type: 'error', text: 'An error occurred while initiating backup.' });
    }
  };

  const updateSettings = (section: keyof SystemSettings, field: string, value: any) => {
    if (!settings) return;
    
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value
      }
    });
  };

  if (loading) {
    return (
      <DashboardLayout user={currentUser}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Settings className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading settings...</p>
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
            <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
            <p className="text-muted-foreground">
              Configure system preferences and security settings
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => fetchSettings()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={handleSaveSettings} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
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

        {/* Settings Tabs */}
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="backup">Backup & Data</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Institution Information
                </CardTitle>
                <CardDescription>
                  Basic information about your institution
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="institutionName">Institution Name</Label>
                    <Input
                      id="institutionName"
                      value={settings?.general.institutionName || ''}
                      onChange={(e) => updateSettings('general', 'institutionName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={settings?.general.contactEmail || ''}
                      onChange={(e) => updateSettings('general', 'contactEmail', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="institutionAddress">Address</Label>
                  <Textarea
                    id="institutionAddress"
                    value={settings?.general.institutionAddress || ''}
                    onChange={(e) => updateSettings('general', 'institutionAddress', e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Phone Number</Label>
                    <Input
                      id="contactPhone"
                      value={settings?.general.contactPhone || ''}
                      onChange={(e) => updateSettings('general', 'contactPhone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select 
                      value={settings?.general.timezone || ''}
                      onValueChange={(value) => updateSettings('general', 'timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select 
                      value={settings?.general.language || ''}
                      onValueChange={(value) => updateSettings('general', 'language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Attendance Settings
                </CardTitle>
                <CardDescription>
                  Configure attendance tracking and QR code behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="qrCodeExpiry">QR Code Expiry (minutes)</Label>
                    <Input
                      id="qrCodeExpiry"
                      type="number"
                      value={settings?.attendance.qrCodeExpiry || ''}
                      onChange={(e) => updateSettings('attendance', 'qrCodeExpiry', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="attendanceGracePeriod">Grace Period (minutes)</Label>
                    <Input
                      id="attendanceGracePeriod"
                      type="number"
                      value={settings?.attendance.attendanceGracePeriod || ''}
                      onChange={(e) => updateSettings('attendance', 'attendanceGracePeriod', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="attendanceThreshold">Attendance Threshold (%)</Label>
                    <Input
                      id="attendanceThreshold"
                      type="number"
                      min="0"
                      max="100"
                      value={settings?.attendance.attendanceThreshold || ''}
                      onChange={(e) => updateSettings('attendance', 'attendanceThreshold', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proximityRadius">Proximity Radius (meters)</Label>
                    <Input
                      id="proximityRadius"
                      type="number"
                      value={settings?.attendance.proximityRadius || ''}
                      onChange={(e) => updateSettings('attendance', 'proximityRadius', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoMarkAbsent"
                    checked={settings?.attendance.autoMarkAbsent || false}
                    onCheckedChange={(checked) => updateSettings('attendance', 'autoMarkAbsent', checked)}
                  />
                  <Label htmlFor="autoMarkAbsent">Automatically mark students absent after grace period</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Configure how and when notifications are sent
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="emailNotifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send notifications via email</p>
                    </div>
                    <Switch
                      id="emailNotifications"
                      checked={settings?.notifications.emailNotifications || false}
                      onCheckedChange={(checked) => updateSettings('notifications', 'emailNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="smsNotifications">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">Send notifications via SMS</p>
                    </div>
                    <Switch
                      id="smsNotifications"
                      checked={settings?.notifications.smsNotifications || false}
                      onCheckedChange={(checked) => updateSettings('notifications', 'smsNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="lowAttendanceAlert">Low Attendance Alerts</Label>
                      <p className="text-sm text-muted-foreground">Alert when attendance falls below threshold</p>
                    </div>
                    <Switch
                      id="lowAttendanceAlert"
                      checked={settings?.notifications.lowAttendanceAlert || false}
                      onCheckedChange={(checked) => updateSettings('notifications', 'lowAttendanceAlert', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="attendanceReports">Attendance Reports</Label>
                      <p className="text-sm text-muted-foreground">Weekly attendance summary reports</p>
                    </div>
                    <Switch
                      id="attendanceReports"
                      checked={settings?.notifications.attendanceReports || false}
                      onCheckedChange={(checked) => updateSettings('notifications', 'attendanceReports', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="systemMaintenance">System Maintenance</Label>
                      <p className="text-sm text-muted-foreground">Notifications about system updates and maintenance</p>
                    </div>
                    <Switch
                      id="systemMaintenance"
                      checked={settings?.notifications.systemMaintenance || false}
                      onCheckedChange={(checked) => updateSettings('notifications', 'systemMaintenance', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Configure security policies and authentication settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      min="6"
                      max="32"
                      value={settings?.security.passwordMinLength || ''}
                      onChange={(e) => updateSettings('security', 'passwordMinLength', parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings?.security.sessionTimeout || ''}
                      onChange={(e) => updateSettings('security', 'sessionTimeout', parseInt(e.target.value))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Maximum Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    min="3"
                    max="10"
                    value={settings?.security.maxLoginAttempts || ''}
                    onChange={(e) => updateSettings('security', 'maxLoginAttempts', parseInt(e.target.value))}
                    className="w-32"
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="passwordRequireSpecialChars">Require Special Characters</Label>
                      <p className="text-sm text-muted-foreground">Passwords must contain special characters</p>
                    </div>
                    <Switch
                      id="passwordRequireSpecialChars"
                      checked={settings?.security.passwordRequireSpecialChars || false}
                      onCheckedChange={(checked) => updateSettings('security', 'passwordRequireSpecialChars', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Enable 2FA for enhanced security</p>
                    </div>
                    <Switch
                      id="twoFactorAuth"
                      checked={settings?.security.twoFactorAuth || false}
                      onCheckedChange={(checked) => updateSettings('security', 'twoFactorAuth', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="backup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Backup & Data Management
                </CardTitle>
                <CardDescription>
                  Configure automated backups and data retention policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoBackup">Automatic Backup</Label>
                    <p className="text-sm text-muted-foreground">Enable automated system backups</p>
                  </div>
                  <Switch
                    id="autoBackup"
                    checked={settings?.backup.autoBackup || false}
                    onCheckedChange={(checked) => updateSettings('backup', 'autoBackup', checked)}
                  />
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                    <Select 
                      value={settings?.backup.backupFrequency || ''}
                      onValueChange={(value) => updateSettings('backup', 'backupFrequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="retentionPeriod">Retention Period (days)</Label>
                    <Input
                      id="retentionPeriod"
                      type="number"
                      value={settings?.backup.retentionPeriod || ''}
                      onChange={(e) => updateSettings('backup', 'retentionPeriod', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Last Backup</h4>
                      <p className="text-sm text-muted-foreground">
                        {settings?.backup.lastBackup ? 
                          new Date(settings.backup.lastBackup).toLocaleString() : 
                          'Never'
                        }
                      </p>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Healthy
                    </Badge>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={handleBackupNow}>
                      <Download className="h-4 w-4 mr-2" />
                      Backup Now
                    </Button>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Restore
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clean Old Backups
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
