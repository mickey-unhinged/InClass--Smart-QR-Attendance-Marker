import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { generateSessionCode, generateQRCode } from '@/lib/qrcode';
import { QrCode, Clock, Users, LogOut } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Class {
  id: string;
  course_code: string;
  course_name: string;
}

export default function StartSession() {
  const { classId } = useParams();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [classData, setClassData] = useState<Class | null>(null);
  const [duration, setDuration] = useState('10');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClass();
  }, [classId]);

  const fetchClass = async () => {
    if (!classId || !user) return;

    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .eq('lecturer_id', user.id)
        .single();

      if (error) throw error;
      setClassData(data);
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

  const handleStartSession = async () => {
    if (!classData || !user) return;

    try {
      const sessionCode = generateSessionCode();
      const durationMinutes = parseInt(duration);
      const endTime = new Date(Date.now() + durationMinutes * 60 * 1000);

      const { data, error } = await supabase
        .from('attendance_sessions')
        .insert({
          class_id: classData.id,
          lecturer_id: user.id,
          session_code: sessionCode,
          end_time: endTime.toISOString(),
          duration_minutes: durationMinutes,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Session Started',
        description: 'Attendance session is now active',
      });

      navigate(`/lecturer/active-session/${data.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
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
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/lecturer/classes')}>
              ← Back
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Start Attendance Session</h1>
          </div>
          <Button onClick={signOut} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-6 h-6 text-primary" />
              {classData?.course_code} - {classData?.course_name}
            </CardTitle>
            <CardDescription>
              Configure and start a new attendance session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Session Duration</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="90">1.5 hours</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="180">3 hours</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Students will have this much time to scan the QR code
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-medium">Session will be active for {duration} minutes</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-medium">Students can scan once per session</span>
              </div>
            </div>

            <Button onClick={handleStartSession} className="w-full" size="lg">
              <QrCode className="w-5 h-5 mr-2" />
              Generate QR Code & Start Session
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}