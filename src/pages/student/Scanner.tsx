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

export default function Scanner() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [scanning, setScanning] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);

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

      // Generate device fingerprint for fraud prevention
      const deviceFingerprint = await getStableDeviceFingerprint();
      console.log('🔒 Device Fingerprint Generated (hashed):', deviceFingerprint);
      console.log('🔒 Session ID:', session.id);
      console.log('🔒 Student ID:', user.id);

      // SECURITY CHECK 1: Has this device already been used by another student in this session?
      const { data: deviceCheck } = await supabase
        .from('attendance_records')
        .select('student_id')
        .eq('session_id', session.id)
        .eq('device_fingerprint', deviceFingerprint)
        .neq('student_id', user.id)
        .maybeSingle();

      if (deviceCheck) {
        toast({
          title: 'Device Already Used',
          description: 'This device has already been used by another student for this session. Each student must use their own device.',
          variant: 'destructive',
        });
        setScanning(false);
        return;
      }

      // SECURITY CHECK 2: Has this student already scanned from a different device?
      const { data: studentCheck } = await supabase
        .from('attendance_records')
        .select('device_fingerprint')
        .eq('session_id', session.id)
        .eq('student_id', user.id)
        .maybeSingle();

      console.log('🔒 Student Check Result:', studentCheck);
      
      if (studentCheck && studentCheck.device_fingerprint !== deviceFingerprint) {
        toast({
          title: 'Different Device Detected',
          description: 'You have already marked attendance from a different device. You cannot mark attendance again from this device.',
          variant: 'destructive',
        });
        setScanning(false);
        return;
      }

      // SECURITY CHECK 3: Duplicate scan prevention (same student, same session, same device)
      if (studentCheck && studentCheck.device_fingerprint === deviceFingerprint) {
        toast({
          title: 'Already Marked',
          description: 'You have already marked attendance for this session from this device.',
          variant: 'destructive',
        });
        setScanning(false);
        return;
      }

      // Record attendance with device fingerprint
      console.log('🔒 Recording attendance with fingerprint:', deviceFingerprint);
      const { error: recordError } = await supabase
        .from('attendance_records')
        .insert({
          session_id: session.id,
          student_id: user.id,
          device_fingerprint: deviceFingerprint,
          device_info: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            fingerprint: deviceFingerprint,
          }
        });
      
      console.log('🔒 Record Error:', recordError);

      if (recordError) {
        if (recordError.code === '23505') { // Unique constraint violation
          toast({
            title: 'Already Marked',
            description: 'You have already marked attendance for this session',
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
          <CardContent>
            {!scanning ? (
              <Button onClick={() => setScanning(true)} className="w-full" size="lg">
                <Camera className="w-5 h-5 mr-2" />
                Open Camera
              </Button>
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