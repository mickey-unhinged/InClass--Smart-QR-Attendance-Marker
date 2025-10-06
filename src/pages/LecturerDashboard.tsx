import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, QrCode } from 'lucide-react';

export default function LecturerDashboard() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <QrCode className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">InClass - Lecturer</h1>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome, {user?.user_metadata?.full_name || 'Lecturer'}</CardTitle>
              <CardDescription>Lecturer Dashboard - Coming Soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This is your lecturer dashboard placeholder. Features will be added in the next phases:
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Generate QR codes for attendance sessions</li>
                <li>• Manage your classes and students</li>
                <li>• View attendance reports and analytics</li>
                <li>• Export attendance data</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
