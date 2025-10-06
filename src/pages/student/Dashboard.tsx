import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, QrCode, TrendingUp, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import BrowseClasses from './BrowseClasses';

export default function StudentDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    classesToday: 0,
    overallAttendance: 0,
    scansThisWeek: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Get enrolled classes
      const { data: enrolledClasses } = await supabase
        .from('student_enrollments')
        .select('class_id')
        .eq('student_id', user?.id);

      const enrolledClassIds = enrolledClasses?.map((e) => e.class_id) || [];

      // Get sessions today for enrolled classes
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: sessionsToday } = await supabase
        .from('attendance_sessions')
        .select('id')
        .in('class_id', enrolledClassIds)
        .gte('start_time', today.toISOString())
        .lt('start_time', tomorrow.toISOString());

      // Get total attendance records
      const { data: allRecords } = await supabase
        .from('attendance_records')
        .select('id, session_id')
        .eq('student_id', user?.id);

      // Get total sessions for enrolled classes
      const { data: allSessions } = await supabase
        .from('attendance_sessions')
        .select('id')
        .in('class_id', enrolledClassIds);

      // Calculate attendance percentage
      const totalSessions = allSessions?.length || 0;
      const attendedSessions = allRecords?.length || 0;
      const attendancePercentage =
        totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0;

      // Get scans this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: weekRecords } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('student_id', user?.id)
        .gte('scanned_at', weekAgo.toISOString());

      setStats({
        classesToday: sessionsToday?.length || 0,
        overallAttendance: attendancePercentage,
        scansThisWeek: weekRecords?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">InClass - Student</h1>
            <p className="text-sm text-muted-foreground">Welcome back!</p>
          </div>
          <Button onClick={signOut} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground mt-2">
              Track your attendance and academic progress
            </p>
          </div>

          {/* Quick Scan Button */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  onClick={() => navigate('/student/scanner')}
                  size="lg" 
                  className="h-16"
                >
                  <QrCode className="w-5 h-5 mr-2" />
                  Scan QR Code
                </Button>
                <Button 
                  onClick={() => navigate('/student/attendance')}
                  size="lg" 
                  variant="outline"
                  className="h-16"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  View History
                </Button>
                <Button 
                  onClick={() => navigate('/student/settings')}
                  size="lg" 
                  variant="outline"
                  className="h-16"
                >
                  <Settings className="w-5 h-5 mr-2" />
                  Settings
                </Button>
                <Button 
                  onClick={signOut}
                  size="lg" 
                  variant="outline"
                  className="h-16"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Classes Today</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : stats.classesToday}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active sessions for your enrolled classes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : `${stats.overallAttendance}%`}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all enrolled classes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scans This Week</CardTitle>
                <QrCode className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : stats.scansThisWeek}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last 7 days
                </p>
              </CardContent>
            </Card>
          </div>

          <BrowseClasses />
        </div>
      </main>
    </div>
  );
}