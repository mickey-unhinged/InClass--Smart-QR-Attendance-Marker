import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Bell, MapPin, Shield, Palette } from 'lucide-react';
import { requestNotificationPermission } from '@/lib/notifications';
import { useTheme } from 'next-themes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);

  useEffect(() => {
    // Check current notification permission
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }

    // Check location permission
    if ('geolocation' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationEnabled(result.state === 'granted');
      });
    }
  }, []);

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      setNotificationsEnabled(granted);
      
      if (granted) {
        toast({
          title: 'Notifications Enabled',
          description: 'You will receive attendance session alerts',
        });
      } else {
        toast({
          title: 'Permission Denied',
          description: 'Please enable notifications in browser settings',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Notifications Disabled',
        description: 'You will not receive attendance alerts',
      });
      setNotificationsEnabled(false);
    }
  };

  const handleLocationToggle = async (enabled: boolean) => {
    if (enabled) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          () => {
            setLocationEnabled(true);
            toast({
              title: 'Location Enabled',
              description: 'Location verification active for attendance',
            });
          },
          () => {
            toast({
              title: 'Permission Denied',
              description: 'Please enable location in browser settings',
              variant: 'destructive',
            });
            setLocationEnabled(false);
          }
        );
      }
    } else {
      setLocationEnabled(false);
      toast({
        title: 'Location Disabled',
        description: 'Location verification will be skipped',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/student/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your preferences</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Receive alerts when attendance sessions are active
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications" className="flex flex-col gap-1">
                  <span>Push Notifications</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    Get notified about active sessions
                  </span>
                </Label>
                <Switch
                  id="notifications"
                  checked={notificationsEnabled}
                  onCheckedChange={handleNotificationToggle}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Services
              </CardTitle>
              <CardDescription>
                Enable location verification for attendance marking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="location" className="flex flex-col gap-1">
                  <span>Location Verification</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    Verify you're in the classroom when marking attendance
                  </span>
                </Label>
                <Switch
                  id="location"
                  checked={locationEnabled}
                  onCheckedChange={handleLocationToggle}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize how the app looks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="theme" className="flex flex-col gap-1">
                  <span>Theme</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    Choose your preferred color theme
                  </span>
                </Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>
                Your data protection information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong>Data Collected:</strong> Attendance records, timestamps, device information
                </p>
                <p>
                  <strong>Security:</strong> All data is encrypted and stored securely
                </p>
                <p>
                  <strong>Fraud Prevention:</strong> Screenshot detection and duplicate scan prevention active
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
