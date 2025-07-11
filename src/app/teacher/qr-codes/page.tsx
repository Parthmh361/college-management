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
  QrCode, 
  Download, 
  Clock, 
  MapPin,
  Calendar,
  Users,
  RefreshCw,
  CheckCircle
} from 'lucide-react';

interface Subject {
  _id: string;
  name: string;
  code: string;
  enrolledStudents: string[];
}

interface QRCodeData {
  _id: string;
  qrCodeImage: string;
  subject: Subject;
  startTime: string;
  endTime: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
    radius: number;
  };
  expiresAt: string;
  isActive: boolean;
  scannedBy: Array<{
    student: string;
    scannedAt: string;
  }>;
}

export default function QRCodeGeneration() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeQRCodes, setActiveQRCodes] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    subjectId: '',
    startTime: '',
    endTime: '',
    location: '',
    expiryMinutes: '30',
    latitude: '',
    longitude: '',
    radius: '100'
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userData || !token) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'Teacher' && parsedUser.role !== 'Admin') {
      router.push('/dashboard');
      return;
    }

    setUser(parsedUser);
    fetchSubjects();
    fetchActiveQRCodes();
    getCurrentLocation();
  }, [router]);

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching subjects with token:', token ? 'Token exists' : 'No token');
      
      const response = await fetch('/api/subjects', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Subjects response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.data?.subjects || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch subjects:', response.status, errorData);
        setError('Failed to fetch subjects');
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setError('Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };


  const fetchActiveQRCodes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/qr/generate?active=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setActiveQRCodes(data.qrCodes || []);
      }
    } catch (error) {
      console.error('Error fetching QR codes:', error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateQRCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subjectId: formData.subjectId,
          classStartTime: formData.startTime,
          classEndTime: formData.endTime,
          location: {
            address: formData.location,
            latitude: parseFloat(formData.latitude),
            longitude: parseFloat(formData.longitude),
            radius: parseInt(formData.radius)
          },
          expiryMinutes: parseInt(formData.expiryMinutes)
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('QR Code generated successfully!');
        fetchActiveQRCodes(); // Refresh the list
        // Reset form
        setFormData(prev => ({
          ...prev,
          subjectId: '',
          startTime: '',
          endTime: '',
          location: ''
        }));
      } else {
        setError(data.message || 'Failed to generate QR code');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = (qrCodeData: string, subject: string) => {
    const link = document.createElement('a');
    link.href = qrCodeData;
    link.download = `${subject}_QR_${new Date().toISOString().split('T')[0]}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deactivateQRCode = async (qrCodeId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/qr/${qrCodeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccess('QR Code deactivated successfully!');
        fetchActiveQRCodes();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to deactivate QR code');
      }
    } catch (error) {
      setError('Failed to deactivate QR code');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">QR Code Management</h1>
          <p className="text-gray-600">Generate QR codes for attendance tracking</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Code Generation Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="mr-2 h-5 w-5" />
                Generate New QR Code
              </CardTitle>
              <CardDescription>
                Create a QR code for students to scan and mark attendance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={generateQRCode} className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Select value={formData.subjectId} onValueChange={(value) => handleInputChange('subjectId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject._id} value={subject._id}>
                          {subject.name} ({subject.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Class Start Time</Label>
                    <Input
                      type="datetime-local"
                      id="startTime"
                      value={formData.startTime}
                      onChange={(e) => handleInputChange('startTime', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">Class End Time</Label>
                    <Input
                      type="datetime-local"
                      id="endTime"
                      value={formData.endTime}
                      onChange={(e) => handleInputChange('endTime', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Location/Room</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g., Room 101, Computer Lab"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiryMinutes">Expiry (minutes)</Label>
                    <Select value={formData.expiryMinutes} onValueChange={(value) => handleInputChange('expiryMinutes', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="radius">Location Radius (meters)</Label>
                    <Input
                      id="radius"
                      type="number"
                      value={formData.radius}
                      onChange={(e) => handleInputChange('radius', e.target.value)}
                      placeholder="100"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <QrCode className="mr-2 h-4 w-4" />
                      Generate QR Code
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Active QR Codes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Active QR Codes
                </span>
                <Button variant="outline" size="sm" onClick={fetchActiveQRCodes}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription>
                Currently active QR codes for attendance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeQRCodes.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No active QR codes</p>
                ) : (
                  activeQRCodes.map((qrCode) => (
                    <div key={qrCode._id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{qrCode.subject.name}</h3>
                          <p className="text-sm text-gray-500">{qrCode.subject.code}</p>
                        </div>
                        <Badge variant={qrCode.isActive ? "default" : "secondary"}>
                          {qrCode.isActive ? "Active" : "Expired"}
                        </Badge>
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-3 w-3" />
                          {new Date(qrCode.startTime).toLocaleString()} - {new Date(qrCode.endTime).toLocaleString()}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="mr-2 h-3 w-3" />
                          {qrCode.location.address}
                        </div>
                        <div className="flex items-center">
                          <Users className="mr-2 h-3 w-3" />
                          {qrCode.scannedBy.length} students scanned
                        </div>
                      </div>

                      {qrCode.qrCodeImage && (
                        <div className="flex justify-center">
                          <img 
                            src={qrCode.qrCodeImage} 
                            alt="QR Code" 
                            className="w-32 h-32 border rounded"
                          />
                        </div>
                      )}

                      <div className="flex space-x-2">
                        {qrCode.qrCodeImage && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadQRCode(qrCode.qrCodeImage, qrCode.subject.name)}
                          >
                            <Download className="mr-2 h-3 w-3" />
                            Download
                          </Button>
                        )}
                        {qrCode.isActive && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => deactivateQRCode(qrCode._id)}
                          >
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
