import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { QRScanner } from '@/components/QRScanner';
import { QrCode, CheckCircle2, LogOut, Camera } from 'lucide-react';
import { validateSessionCode } from '@/lib/qrcode';
import { getDeviceFingerprint, getStableDeviceFingerprint } from '@/lib/securityUtils';
import { calculateDistance } from '@/lib/locationUtils';
import { addPendingAttendance } from '@/lib/offlineStorage';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export default function Scanner() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [scanning, setScanning] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const isOnline = useOnlineStatus();

  const handleScan = async (code: string) => {
    if (!user) return;

    // Validate code format
    if (!validateSessionCode(code)) {
      toast({
        title: 'Invalid QR Code',
        description: 'This is not a valid attendance QR code',
        variant: 'destructive',
      });
      setScanning(false);
      return;
    }

    try {
      // Find the session with this code
      const { data: session, error: sessionError } = await supabase
        .from('attendance_sessions')
        .select('*, classes(course_code, course_name)')
        .eq('session_code', code)
        .eq('is_active', true)
        .single();

      if (sessionError || !session) {
        toast({
          title: 'Session Not Found',
          description: 'This session has expired or is no longer active',
          variant: 'destructive',
        });
        setScanning(false);
        return;
      }

      // Check if session is still within time limit
      const now = new Date();
      const endTime = new Date(session.end_time);
      
      if (now > endTime) {
        toast({
          title: 'Session Expired',
          description: 'This attendance session has ended',
          variant: 'destructive',
        });
        setScanning(false);
        return;
      }

      // Auto-enroll student if not already enrolled
      const { data: enrollment, error: enrollCheckError } = await supabase
        .from('student_enrollments')
        .select('id')
        .eq('student_id', user.id)
        .eq('class_id', session.class_id)
        .maybeSingle();

      if (enrollCheckError) {
        console.error('Error checking enrollment:', enrollCheckError);
        toast({
          title: 'Enrollment Check Failed',
          description: 'Unable to verify class enrollment. Please try again.',
          variant: 'destructive',
        });
        setScanning(false);
        return;
      }

      if (!enrollment) {
        // Verify user has student role before enrolling
        const { data: userRole, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'student')
          .maybeSingle();

        if (roleError) {
          console.error('Error checking user role:', roleError);
          toast({
            title: 'Role Verification Failed',
            description: 'Unable to verify student status. Please contact support.',
            variant: 'destructive',
          });
          setScanning(false);
          return;
        }

        if (!userRole) {
          toast({
            title: 'Student Role Required',
            description: 'Your account needs student role access. Please contact your administrator.',
            variant: 'destructive',
          });
          setScanning(false);
          return;
        }

        // Student not enrolled - auto-enroll them
        const { error: enrollError } = await supabase
          .from('student_enrollments')
          .insert({
            student_id: user.id,
            class_id: session.class_id,
          });

        if (enrollError) {
          console.error('Auto-enrollment error:', enrollError);
          toast({
            title: 'Auto-Enrollment Failed',
            description: `Unable to enroll you in ${session.classes.course_code}. Error: ${enrollError.message}`,
            variant: 'destructive',
          });
          setScanning(false);
          return;
        }

        toast({
          title: 'Successfully Enrolled!',
          description: `You've been automatically enrolled in ${session.classes.course_code}`,
        });
      }

      // Generate device fingerprint for fraud prevention
      const deviceFingerprint = await getStableDeviceFingerprint();

      // Handle location verification if required
      let locationData: any = {};
      if (session.location_required && session.classroom_latitude && session.classroom_longitude) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });

          const studentLat = position.coords.latitude;
          const studentLng = position.coords.longitude;
          const distance = calculateDistance(
            { latitude: studentLat, longitude: studentLng },
            { 
              latitude: session.classroom_latitude, 
              longitude: session.classroom_longitude 
            }
          );

          if (distance > session.geofence_radius_meters) {
            toast({
              title: 'Location Verification Failed',
              description: `You must be within ${session.geofence_radius_meters}m of the classroom. You are ${Math.round(distance)}m away.`,
              variant: 'destructive',
            });
            setScanning(false);
            return;
          }

          locationData = {
            student_latitude: studentLat,
            student_longitude: studentLng,
            distance_from_classroom: distance,
            location_verified: true,
          };
        } catch (error) {
          toast({
            title: 'Location Access Required',
            description: 'Please enable location services to mark attendance',
            variant: 'destructive',
          });
          setScanning(false);
          return;
        }
      }

      // Handle offline mode
      if (!isOnline) {
        await addPendingAttendance({
          sessionId: session.id,
          studentId: user.id,
          timestamp: new Date().toISOString(),
          deviceFingerprint,
          location: locationData.student_latitude ? {
            latitude: locationData.student_latitude,
            longitude: locationData.student_longitude,
          } : undefined,
        });

        toast({
          title: 'Attendance Queued',
          description: 'You are offline. Attendance will be synced when connection is restored.',
        });

        setSuccess(true);
        setSessionInfo(session);
        setScanning(false);
        return;
      }

      // Record attendance - database enforces one device per session via unique constraint
      const { error: recordError } = await supabase
        .from('attendance_records')
        .insert({
          session_id: session.id,
          student_id: user.id,
          device_fingerprint: deviceFingerprint,
          ...locationData,
          device_info: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          }
        });

      if (recordError) {
        if (recordError.code === '23505') {
          // Database unique constraint violation - either device or student already used
          toast({
            title: 'Cannot Mark Attendance',
            description: 'This device has already been used for this session by another student',
            variant: 'destructive',
          });
        } else {
          throw recordError;
        }
        setScanning(false);
        return;
      }

      // Success!
      setSessionInfo(session);
      setSuccess(true);
      setScanning(false);
      
      toast({
        title: 'Attendance Marked!',
        description: `Successfully marked for ${session.classes.course_code}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark attendance',
        variant: 'destructive',
      });
      setScanning(false);
    }
  };

  if (success && sessionInfo) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Attendance Confirmed</h1>
            <Button onClick={signOut} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <CardTitle className="text-2xl">Attendance Marked!</CardTitle>
              <CardDescription>
                Your attendance has been successfully recorded
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Course:</span>
                  <span className="font-medium">{sessionInfo.classes.course_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Class:</span>
                  <span className="font-medium">{sessionInfo.classes.course_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-medium">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => {
                  setSuccess(false);
                  setSessionInfo(null);
                }} variant="outline" className="flex-1">
                  Scan Another
                </Button>
                <Button onClick={() => navigate('/student/dashboard')} className="flex-1">
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/student/dashboard')}>
              ← Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Scan QR Code</h1>
          </div>
          <Button onClick={signOut} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <QrCode className="w-10 h-10 text-primary" />
            </div>
            <CardTitle>Mark Your Attendance</CardTitle>
            <CardDescription>
              Scan the QR code displayed by your lecturer to mark your attendance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!scanning ? (
              <>
                <Button onClick={() => setScanning(true)} className="w-full" size="lg">
                  <Camera className="w-5 h-5 mr-2" />
                  Open Camera
                </Button>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  <p className="font-medium">Camera Access Required</p>
                  <p className="text-muted-foreground">
                    This app needs camera permission to scan QR codes. If prompted, please allow camera access.
                  </p>
                  {navigator.geolocation && (
                    <p className="text-muted-foreground text-xs mt-2">
                      Some sessions may also require location access to verify you're in the classroom.
                    </p>
                  )}
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </main>

      {scanning && (
        <QRScanner
          onScan={handleScan}
          onClose={() => setScanning(false)}
        />
      )}
    </div>
  );
}