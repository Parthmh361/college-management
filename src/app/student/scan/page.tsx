'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Camera, Upload, RefreshCw } from 'lucide-react';

interface ScanResult {
  success: boolean;
  message: string;
  data?: {
    attendanceId: string;
    subjectName: string;
    teacherName: string;
    timestamp: string;
    status: string;
  };
}

export default function QRScanPage() {
  const [user, setUser] = useState<any>(null);
  const [scanMode, setScanMode] = useState<'camera' | 'upload'>('camera');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    if (scanMode === 'camera') {
      startCameraScanner();
    }

    return () => {
      stopScanner();
    };
  }, [scanMode]);

  const startCameraScanner = async () => {
    setError(null);
    setScanResult(null);
    setIsScanning(true);

    // Stop any existing scanner
    stopScanner();

    try {
      // Request camera permission explicitly
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Use back camera if available
        } 
      });
      // Stop the stream immediately as html5-qrcode will handle camera access
      stream.getTracks().forEach(track => track.stop());

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 1,
      };

      scannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        config,
        false
      );

      scannerRef.current.render(
        (decodedText: string) => {
          handleScanSuccess(decodedText);
          stopScanner();
        },
        (errorMessage: string) => {
          // Ignore scan errors - they're expected when no QR code is visible
          console.log('Scan error:', errorMessage);
        }
      );
    } catch (error: any) {
      console.error('Camera permission error:', error);
      if (error.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access to scan QR codes.');
      } else if (error.name === 'NotFoundError') {
        setError('No camera found. Please use the file upload option instead.');
      } else {
        setError('Unable to access camera. Please try the file upload option.');
      }
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch((error) => {
        console.error('Failed to clear scanner:', error);
      });
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setScanResult(null);
    setIsScanning(true);

    // Create a temporary scanner instance for file scanning
    import('html5-qrcode').then(({ Html5Qrcode }) => {
      const scanner = new Html5Qrcode('temp');
      
      scanner.scanFile(file, true)
        .then((decodedText) => {
          handleScanSuccess(decodedText);
          setIsScanning(false);
        })
        .catch((error) => {
          setError('Could not read QR code from image. Please try again with a clearer image.');
          setIsScanning(false);
          console.error('File scan error:', error);
        });
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleScanSuccess = async (qrCodeData: string) => {
    try {
      setIsScanning(true);
      
      // Parse QR code data - it should be a JSON string with QR code info
      let qrData;
      try {
        qrData = JSON.parse(qrCodeData);
      } catch {
        // If it's not JSON, treat it as a QR code itself
        qrData = { code: qrCodeData, token: qrCodeData };
      }

      // Get user's location if available
      let location;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              enableHighAccuracy: true
            });
          });
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
        } catch (error) {
          console.log('Location access denied or unavailable');
        }
      }

      const response = await fetch('/api/qr/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          code: qrData.code || qrCodeData,
          token: qrData.token || qrCodeData,
          location,
          deviceInfo: {
            userAgent: navigator.userAgent,
            deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
          }
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setScanResult({
          success: true,
          message: result.message || 'Attendance marked successfully!',
          data: {
            attendanceId: result.data?.attendance?.id,
            subjectName: result.data?.attendance?.subject?.name || result.data?.qrCode?.subject,
            teacherName: result.data?.qrCode?.teacher?.firstName + ' ' + result.data?.qrCode?.teacher?.lastName,
            timestamp: result.data?.attendance?.markedAt,
            status: result.data?.attendance?.status
          },
        });
      } else {
        setScanResult({
          success: false,
          message: result.message || 'Failed to mark attendance',
        });
      }
    } catch (error) {
      console.error('Scan processing error:', error);
      setScanResult({
        success: false,
        message: 'An error occurred while processing the QR code',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setError(null);
    if (scanMode === 'camera') {
      startCameraScanner();
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">QR Code Scanner</h1>
        <p className="text-muted-foreground">
          Scan QR codes to mark your attendance for classes
        </p>
      </div>

      {/* Scan Mode Toggle */}
      <div className="mb-6">
        <div className="flex gap-2">
          <Button
            variant={scanMode === 'camera' ? 'default' : 'outline'}
            onClick={() => setScanMode('camera')}
            className="flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Camera Scan
          </Button>
          <Button
            variant={scanMode === 'upload' ? 'default' : 'outline'}
            onClick={() => setScanMode('upload')}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Image
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {scanMode === 'camera' ? (
                <>
                  <Camera className="w-5 h-5" />
                  Camera Scanner
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload QR Image
                </>
              )}
            </CardTitle>
            <CardDescription>
              {scanMode === 'camera'
                ? 'Position the QR code within the scanning area'
                : 'Select an image file containing a QR code'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scanMode === 'camera' ? (
              <div>
                <div id="qr-reader" className="w-full"></div>
                {error && (
                  <div className="mt-4 space-y-2">
                    <Alert variant="destructive">
                      <XCircle className="w-4 h-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <Button 
                      onClick={() => startCameraScanner()} 
                      variant="outline" 
                      className="w-full"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Try Camera Again
                    </Button>
                  </div>
                )}
                {isScanning && !error && (
                  <div className="text-center mt-4">
                    <div className="inline-flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Scanning for QR codes...</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-4">
                    Click to upload an image containing a QR code
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isScanning}
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Choose Image'
                    )}
                  </Button>
                </div>
                <div id="temp" className="hidden"></div>
              </div>
            )}

            {error && (
              <Alert className="mt-4" variant="destructive">
                <XCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Results Area */}
        <Card>
          <CardHeader>
            <CardTitle>Scan Results</CardTitle>
            <CardDescription>
              Attendance marking status and details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scanResult ? (
              <div className="space-y-4">
                <Alert
                  variant={scanResult.success ? 'default' : 'destructive'}
                >
                  {scanResult.success ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <AlertDescription>{scanResult.message}</AlertDescription>
                </Alert>

                {scanResult.success && scanResult.data && (
                  <div className="space-y-3">
                    <Separator />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Subject:</strong>
                        <p>{scanResult.data.subjectName}</p>
                      </div>
                      <div>
                        <strong>Teacher:</strong>
                        <p>{scanResult.data.teacherName}</p>
                      </div>
                      <div>
                        <strong>Time:</strong>
                        <p>{new Date(scanResult.data.timestamp).toLocaleString()}</p>
                      </div>
                      <div>
                        <strong>Status:</strong>
                        <Badge variant={scanResult.data.status === 'Present' ? 'default' : 'secondary'}>
                          {scanResult.data.status || 'Present'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                <Button onClick={resetScanner} className="w-full">
                  Scan Another QR Code
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Camera className="w-8 h-8" />
                </div>
                <p>No QR code scanned yet</p>
                <p className="text-sm">
                  Scan a QR code to see attendance details here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Camera Scanning
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Select "Camera Scan" mode</li>
                <li>Allow camera permissions when prompted</li>
                <li>Point your camera at the QR code</li>
                <li>Wait for automatic detection and scanning</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Image Upload
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Select "Upload Image" mode</li>
                <li>Click "Choose Image" button</li>
                <li>Select an image file with a QR code</li>
                <li>Wait for automatic processing</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
