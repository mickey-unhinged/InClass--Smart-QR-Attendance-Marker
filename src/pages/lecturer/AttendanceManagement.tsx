import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, UserPlus, UserMinus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Attendee {
  id: string;
  student_id: string;
  scanned_at: string;
  full_name?: string;
  email?: string;
}

export default function AttendanceManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualAddOpen, setManualAddOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (sessionId) {
      fetchAttendees();
    }
  }, [sessionId]);

  const fetchAttendees = async () => {
    if (!sessionId) return;

    // Step 1: fetch records
    const { data: records, error: recordsError } = await supabase
      .from('attendance_records')
      .select('id, student_id, scanned_at')
      .eq('session_id', sessionId)
      .order('scanned_at', { ascending: false });

    if (recordsError) {
      console.error('Fetch attendance records error:', recordsError);
      toast({
        title: 'Error',
        description: `Failed to load attendees: ${recordsError.code || ''} ${recordsError.message}`,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    // Step 2: fetch profiles for unique student IDs
    const studentIds = Array.from(new Set((records || []).map(r => r.student_id)));
    let profilesMap: Record<string, { full_name?: string; email?: string }> = {};
    if (studentIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', studentIds);

      if (profilesError) {
        console.warn('Fetch profiles warning:', profilesError);
      } else if (profilesData) {
        profilesMap = profilesData.reduce((acc: any, p: any) => {
          acc[p.id] = { full_name: p.full_name, email: p.email };
          return acc;
        }, {});
      }
    }

    setAttendees((records || []).map((r) => ({
      id: r.id,
      student_id: r.student_id,
      scanned_at: r.scanned_at as string,
      full_name: profilesMap[r.student_id]?.full_name,
      email: profilesMap[r.student_id]?.email,
    })));
    setLoading(false);
  };

  const addManualAttendance = async () => {
    if (!sessionId || !selectedStudent.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a student email',
        variant: 'destructive',
      });
      return;
    }

    // Look up student by email
    const { data: studentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', selectedStudent.trim())
      .maybeSingle();

    if (profileError || !studentProfile) {
      toast({
        title: 'Error',
        description: 'Student not found with that email address',
        variant: 'destructive',
      });
      return;
    }

    const { error: recordError } = await supabase
      .from('attendance_records')
      .insert({
        session_id: sessionId,
        student_id: studentProfile.id,
        manually_added: true,
      });

    if (!recordError) {
      const { error: adjustmentError } = await supabase
        .from('attendance_adjustments')
        .insert({
          session_id: sessionId,
          student_id: studentProfile.id,
          adjustment_type: 'manual_add',
          reason,
          adjusted_by: user?.id,
          new_status: 'present',
        });

      if (!adjustmentError) {
        toast({
          title: 'Success',
          description: 'Attendance manually added',
        });
        setManualAddOpen(false);
        setSelectedStudent('');
        setReason('');
        fetchAttendees();
      } else {
        toast({
          title: 'Error',
          description: `Failed to log adjustment: ${adjustmentError.message}`,
          variant: 'destructive',
        });
      }
    } else {
      const duplicate = recordError.code === '23505';
      toast({
        title: 'Error',
        description: duplicate
          ? 'Student is already marked present for this session'
          : `Failed to add attendance: ${recordError.code || ''} ${recordError.message}`,
        variant: 'destructive',
      });
    }
  };

  const removeAttendance = async (recordId: string, studentId: string) => {
    if (!sessionId) return;

    const { error: deleteError } = await supabase
      .from('attendance_records')
      .delete()
      .eq('id', recordId);

    if (!deleteError) {
      const { error: adjustmentError } = await supabase
        .from('attendance_adjustments')
        .insert({
          record_id: recordId,
          session_id: sessionId,
          student_id: studentId,
          adjustment_type: 'manual_remove',
          reason: 'Removed by lecturer',
          adjusted_by: user?.id,
          new_status: 'absent',
        });

      if (!adjustmentError) {
        toast({
          title: 'Success',
          description: 'Attendance removed',
        });
        fetchAttendees();
      }
    } else {
      toast({
        title: 'Error',
        description: `Failed to remove attendance: ${deleteError.code || ''} ${deleteError.message}`,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/lecturer/session-history')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Attendance Management</h1>
            <p className="text-muted-foreground">Manually manage attendance records</p>
          </div>
          <Dialog open={manualAddOpen} onOpenChange={setManualAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Attendance
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manually Add Attendance</DialogTitle>
                <DialogDescription>Add attendance for a student who couldn't scan</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="student">Student Email</Label>
                  <Input
                    id="student"
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    placeholder="student@university.edu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., QR scanner not working, device issues..."
                  />
                </div>
                <Button onClick={addManualAttendance} className="w-full">
                  Add Attendance
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : attendees.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No attendance records for this session
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {attendees.map((attendee) => (
              <Card key={attendee.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <div className="font-medium">{attendee.full_name || 'Unknown'}</div>
                    <div className="text-sm text-muted-foreground">{attendee.email}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(attendee.scanned_at), 'MMM dd, HH:mm:ss')}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttendance(attendee.id, attendee.student_id)}
                  >
                    <UserMinus className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
