import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Scan } from 'lucide-react';

export default function StudentDashboard() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Scan className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">InClass - Student</h1>
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
              <CardTitle>Welcome, {user?.user_metadata?.full_name || 'Student'}</CardTitle>
              <CardDescription>Student Dashboard - Coming Soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This is your student dashboard placeholder. Features will be added in the next phases:
              </p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li>• Scan QR codes to mark attendance</li>
                <li>• View your attendance history</li>
                <li>• Check attendance percentages by course</li>
                <li>• Receive notifications for active sessions</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
