import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, QrCode, BarChart3, LogOut, BookOpen, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LecturerDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">InClass - Lecturer</h1>
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
              Manage your classes and track attendance
            </p>
          </div>

          {/* Quick Actions */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button 
                  onClick={() => navigate('/lecturer/classes')}
                  size="lg" 
                  className="h-16"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Classes
                </Button>
                <Button 
                  onClick={() => navigate('/lecturer/history')}
                  size="lg" 
                  variant="outline"
                  className="h-16"
                >
                  <QrCode className="w-5 h-5 mr-2" />
                  History
                </Button>
                <Button 
                  onClick={() => navigate('/lecturer/reports')}
                  size="lg" 
                  variant="outline"
                  className="h-16"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Reports
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
                <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">View in Classes page</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <QrCode className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">Start a session</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reports</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">✓</div>
                <p className="text-xs text-muted-foreground">Export attendance data</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>🎉 Phases 1-7 Complete!</CardTitle>
              <CardDescription>
                Full-featured attendance management system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">✅ What's Working Now:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Create and manage classes</li>
                  <li>• Generate secure, time-limited QR codes</li>
                  <li>• Real-time attendance tracking with live feed</li>
                  <li>• Export reports (PDF & CSV)</li>
                  <li>• Student attendance analytics & charts</li>
                  <li>• Browser notifications</li>
                  <li>• Security features: screenshot prevention, duplicate scan protection</li>
                  <li>• Optional location verification</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium">⏳ Next Steps:</h3>
                <p className="text-sm text-muted-foreground">
                  Ready for production use! Advanced analytics and UI polish ongoing.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
