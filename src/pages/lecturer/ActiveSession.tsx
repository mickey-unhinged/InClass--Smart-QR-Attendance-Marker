import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { generateQRCode } from '@/lib/qrcode';
import { X, Users, Clock, CheckCircle2, LogOut } from 'lucide-react';

interface Session {
  id: string;
  session_code: string;
  end_time: string;
  duration_minutes: number;
  is_active: boolean;
  classes: {
    course_code: string;
    course_name: string;
  };
}

interface AttendanceRecord {
  id: string;
  scanned_at: string;
  profiles: {
    full_name: string | null;
    email: string;
  };
}

export default function ActiveSession() {
  const { sessionId } = useParams();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<Session | null>(null);
  const [qrCode, setQrCode] = useState<string>('');
  const [attendees, setAttendees] = useState<AttendanceRecord[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  useEffect(() => {
    if (!session) return;

    // Set up realtime subscription for new attendance records
    const channel = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance_records',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          fetchAttendees();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, sessionId]);

  useEffect(() => {
    if (!session) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(session.end_time).getTime();
      const remaining = Math.max(0, Math.floor((end - now) / 1000));
      
      setTimeLeft(remaining);
      
      if (remaining === 0 && session.is_active) {
        endSession();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  const fetchSession = async () => {
    if (!sessionId || !user) return;

    try {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*, classes(course_code, course_name)')
        .eq('id', sessionId)
        .eq('lecturer_id', user.id)
        .single();

      if (error) throw error;
      
      setSession(data);
      
      // Generate QR code
      const qr = await generateQRCode(data.session_code);
      setQrCode(qr);
      
      await fetchAttendees();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      navigate('/lecturer/classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendees = async () => {
    if (!sessionId) return;

    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('id, scanned_at, student_id')
        .eq('session_id', sessionId)
        .order('scanned_at', { ascending: false });

      if (error) throw error;
      
      // Fetch profile data for each student
      if (data) {
        const enrichedData = await Promise.all(
          data.map(async (record) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', record.student_id)
              .single();
            
            return {
              ...record,
              profiles: profile || { full_name: null, email: 'Unknown' }
            };
          })
        );
        
        setAttendees(enrichedData);
      }
    } catch (error: any) {
      console.error('Error fetching attendees:', error);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;

    try {
      const { error } = await supabase
        .from('attendance_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: 'Session Ended',
        description: `Session closed with ${attendees.length} attendees`,
      });

      navigate('/lecturer/classes');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Active Session</h1>
            <p className="text-sm text-muted-foreground">
              {session?.classes.course_code} - {session?.classes.course_name}
            </p>
          </div>
          <Button onClick={signOut} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* QR Code Display */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance QR Code</CardTitle>
              <CardDescription>
                Students scan this code to mark attendance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                {qrCode && (
                  <img src={qrCode} alt="QR Code" className="w-full max-w-sm rounded-lg border-2 border-border" />
                )}
              </div>
              
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="font-medium">Time Remaining</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">{formatTime(timeLeft)}</span>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    <span className="font-medium">Attendees</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">{attendees.length}</span>
                </div>
              </div>

              <Button onClick={endSession} variant="destructive" className="w-full" size="lg">
                <X className="w-5 h-5 mr-2" />
                End Session Now
              </Button>
            </CardContent>
          </Card>

          {/* Attendees List */}
          <Card>
            <CardHeader>
              <CardTitle>Live Attendance Feed</CardTitle>
              <CardDescription>
                Real-time updates as students scan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attendees.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Waiting for students to scan...
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {attendees.map((record) => (
                    <div key={record.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {record.profiles.full_name || record.profiles.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(record.scanned_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}