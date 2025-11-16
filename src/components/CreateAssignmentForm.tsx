import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

interface CreateAssignmentFormProps {
  onSuccess: () => void;
}

export function CreateAssignmentForm({ onSuccess }: CreateAssignmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    class_id: '',
    assignment_type: 'assignment',
    go_live_date: '',
    due_date: '',
    duration_minutes: '',
    max_score: '100',
  });

  const { data: classes } = useQuery({
    queryKey: ['lecturer-classes-for-assignment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('id, course_name, course_code')
        .eq('archived', false)
        .order('course_name');
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let fileUrl = null;
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('assignments')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('assignments')
          .getPublicUrl(fileName);
        
        fileUrl = publicUrl;
      }

      const { error } = await supabase.from('assignments').insert({
        title: formData.title,
        description: formData.description,
        class_id: formData.class_id,
        assignment_type: formData.assignment_type as 'assignment' | 'cat',
        go_live_date: formData.go_live_date,
        due_date: formData.due_date,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        max_score: parseFloat(formData.max_score),
        file_url: fileUrl,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success('Assignment created successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="class">Class</Label>
        <Select required value={formData.class_id} onValueChange={(value) => setFormData({ ...formData, class_id: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select a class" />
          </SelectTrigger>
          <SelectContent>
            {classes?.map((cls) => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.course_code} - {cls.course_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="type">Type</Label>
        <Select value={formData.assignment_type} onValueChange={(value) => setFormData({ ...formData, assignment_type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="assignment">Assignment</SelectItem>
            <SelectItem value="cat">CAT (Timed Test)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="go_live_date">Go Live Date</Label>
          <Input
            id="go_live_date"
            type="datetime-local"
            required
            value={formData.go_live_date}
            onChange={(e) => setFormData({ ...formData, go_live_date: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="due_date">Due Date</Label>
          <Input
            id="due_date"
            type="datetime-local"
            required
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          />
        </div>
      </div>

      {formData.assignment_type === 'cat' && (
        <div>
          <Label htmlFor="duration_minutes">Duration (minutes)</Label>
          <Input
            id="duration_minutes"
            type="number"
            required
            min="1"
            value={formData.duration_minutes}
            onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
          />
        </div>
      )}

      <div>
        <Label htmlFor="max_score">Maximum Score</Label>
        <Input
          id="max_score"
          type="number"
          required
          min="0"
          step="0.1"
          value={formData.max_score}
          onChange={(e) => setFormData({ ...formData, max_score: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="file">Assignment File (Optional)</Label>
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

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Creating...' : 'Create Assignment'}
      </Button>
    </form>
  );
}
