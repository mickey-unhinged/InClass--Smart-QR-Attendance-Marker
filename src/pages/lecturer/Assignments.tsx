import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Clock, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreateAssignmentForm } from '@/components/CreateAssignmentForm';
import { AssignmentSubmissions } from '@/components/AssignmentSubmissions';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function Assignments() {
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: assignments, refetch } = useQuery({
    queryKey: ['lecturer-assignments'],
    queryFn: async () => {
      const { data: assignmentsData, error } = await supabase
        .from('assignments')
        .select(`
          *,
          classes (
            course_name,
            course_code
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const assignmentsWithCounts = await Promise.all(
        (assignmentsData || []).map(async (assignment) => {
          const { count } = await supabase
            .from('assignment_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('assignment_id', assignment.id);

          return { ...assignment, submissionCount: count || 0 };
        })
      );

      return assignmentsWithCounts;
    },
  });

  const handleAssignmentCreated = () => {
    setIsCreateOpen(false);
    refetch();
  };

  if (selectedAssignment) {
    return (
      <div className="container mx-auto p-6">
        <Button
          variant="outline"
          onClick={() => setSelectedAssignment(null)}
          className="mb-4"
        >
          ← Back to Assignments
        </Button>
        <AssignmentSubmissions assignmentId={selectedAssignment} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="text-muted-foreground">Manage assignments and CATs</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
            </DialogHeader>
            <CreateAssignmentForm onSuccess={handleAssignmentCreated} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assignments?.map((assignment) => (
          <Card
            key={assignment.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedAssignment(assignment.id)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{assignment.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {assignment.classes?.course_code} - {assignment.classes?.course_name}
                  </CardDescription>
                </div>
                <Badge variant={assignment.assignment_type === 'cat' ? 'destructive' : 'default'}>
                  {assignment.assignment_type.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Goes live: {formatDistanceToNow(new Date(assignment.go_live_date), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Due: {formatDistanceToNow(new Date(assignment.due_date), { addSuffix: true })}
                  </span>
                </div>
                {assignment.assignment_type === 'cat' && assignment.duration_minutes && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Duration: {assignment.duration_minutes} minutes
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {assignment.submissionCount} submission{assignment.submissionCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {assignments?.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No assignments yet. Create your first assignment to get started.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
