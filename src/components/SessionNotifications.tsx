import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { requestNotificationPermission, sendNotification } from '@/lib/notifications';
import { useToast } from '@/hooks/use-toast';

export default function SessionNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    // Request notification permission on mount
    requestNotificationPermission();

    // Subscribe to new sessions for enrolled classes
    const channel = supabase
      .channel('session-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance_sessions',
        },
        async (payload) => {
          // Check if student is enrolled in this class
          const { data: enrollment } = await supabase
            .from('student_enrollments')
            .select('class_id, classes(course_code, course_name)')
            .eq('student_id', user.id)
            .eq('class_id', payload.new.class_id)
            .maybeSingle();

          if (enrollment) {
            const classInfo = enrollment.classes as any;
            const courseName = `${classInfo.course_code} - ${classInfo.course_name}`;
            
            // Show browser notification using service worker
            await sendNotification('Attendance Session Active! 🎓', {
              body: `${courseName} - Scan now to mark attendance`,
              tag: 'session-active',
              requireInteraction: true,
            });

            // Show toast notification
            toast({
              title: 'New Session Active!',
              description: `${courseName} - Scan QR code now`,
              duration: 10000,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  // Subscribe to ended sessions to notify about missed classes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('missed-class-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'attendance_sessions',
          filter: 'is_active=eq.false',
        },
        async (payload) => {
          // Check if student was enrolled but didn't attend
          const { data: enrollment } = await supabase
            .from('student_enrollments')
            .select('class_id, classes(course_code, course_name)')
            .eq('student_id', user.id)
            .eq('class_id', payload.new.class_id)
            .maybeSingle();

          if (enrollment) {
            // Check if student attended this session
            const { data: attendance } = await supabase
              .from('attendance_records')
              .select('id')
              .eq('session_id', payload.new.id)
              .eq('student_id', user.id)
              .maybeSingle();

            if (!attendance) {
              const classInfo = enrollment.classes as any;
              const courseName = `${classInfo.course_code} - ${classInfo.course_name}`;
              
              // Show notification for missed class using service worker
              await sendNotification('Missed Class Alert', {
                body: `You missed: ${courseName}`,
                tag: 'missed-class',
              });

              toast({
                title: 'Missed Class',
                description: `You didn't attend ${courseName}`,
                variant: 'destructive',
                duration: 8000,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  return null; // This is a headless component
}
