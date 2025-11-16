import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

interface AssignmentSubmitDialogProps {
  assignment: any;
  trigger: React.ReactNode;
}

export function AssignmentSubmitDialog({ assignment, trigger }: AssignmentSubmitDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let fileUrl = null;
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${assignment.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('submissions')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('submissions')
          .getPublicUrl(fileName);
        
        fileUrl = publicUrl;
      }

      const { error } = await supabase.from('assignment_submissions').insert({
        assignment_id: assignment.id,
        student_id: user.id,
        submission_file_url: fileUrl,
        content: content || null,
        is_late: new Date() > new Date(assignment.due_date),
      });

      if (error) throw error;

      toast.success('Assignment submitted successfully');
      setOpen(false);
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Assignment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="file">Upload File</Label>
            <div className="mt-2">
              <label
                htmlFor="file"
                className="flex items-center justify-center w-full h-32 px-4 transition bg-background border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-primary focus:outline-none"
              >
                <div className="flex flex-col items-center space-y-2">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {file ? file.name : 'Click to upload file'}
                  </span>
                </div>
                <input
                  id="file"
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>

          <div>
            <Label htmlFor="content">Additional Notes (Optional)</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Add any notes or comments..."
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading || (!file && !content.trim())}
            className="w-full"
          >
            {loading ? 'Submitting...' : 'Submit Assignment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
