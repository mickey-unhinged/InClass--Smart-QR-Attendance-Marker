import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import AddGroupMembers from '@/components/AddGroupMembers';

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  max_members: number;
  is_public: boolean;
  created_by: string;
  member_count?: number;
  is_member?: boolean;
  is_creator?: boolean;
}

export default function StudyGroups() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', maxMembers: 6 });

  useEffect(() => {
    if (user) {
      fetchGroups();

      // Realtime subscription for study_groups
      const groupsChannel = supabase
        .channel('study-groups-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'study_groups',
          },
          () => {
            console.info('Study groups table changed, refetching...');
            fetchGroups();
          }
        )
        .subscribe();

      // Realtime subscription for study_group_members (filtered to current user)
      const membersChannel = supabase
        .channel('study-group-members-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'study_group_members',
            filter: `student_id=eq.${user.id}`,
          },
          () => {
            console.info('Study group members changed for current user, refetching...');
            fetchGroups();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(groupsChannel);
        supabase.removeChannel(membersChannel);
      };
    }
  }, [user]);

  const fetchGroups = async () => {
    if (!user) return;

    // Fetch groups visible to the user (public, created_by user, or member of)
    const { data: groupsData, error: groupsError } = await supabase
      .from('study_groups')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: memberData } = await supabase
      .from('study_group_members')
      .select('group_id')
      .eq('student_id', user.id);

    const memberGroupIds = memberData?.map(m => m.group_id) || [];

    if (groupsData) {
      const groupsWithCounts = await Promise.all(
        groupsData.map(async (group) => {
          const { count, error: countError } = await supabase
            .from('study_group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          // If RLS blocks count, show undefined to display "–" in UI
          const memberCount = countError ? undefined : (count || 0);

          return {
            ...group,
            member_count: memberCount,
            is_member: memberGroupIds.includes(group.id),
            is_creator: group.created_by === user?.id,
          };
        })
      );

      setGroups(groupsWithCounts);
    }
    setLoading(false);
  };

  const createGroup = async () => {
    if (!user || !newGroup.name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a group name',
        variant: 'destructive',
      });
      return;
    }

    // Check if user has student role
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'student')
      .maybeSingle();

    if (roleError || !userRole) {
      toast({
        title: 'Error',
        description: 'You need student role to create study groups. Contact admin.',
        variant: 'destructive',
      });
      return;
    }

    // Get first enrolled class or show error
    const { data: enrollments, error: enrollError } = await supabase
      .from('student_enrollments')
      .select('class_id')
      .eq('student_id', user.id)
      .limit(1);

    if (enrollError) {
      console.error('Enrollment check error:', enrollError);
      toast({
        title: 'Error',
        description: 'Failed to check enrollments. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    if (!enrollments || enrollments.length === 0) {
      toast({
        title: 'Error',
        description: 'You must be enrolled in at least one class to create a study group',
        variant: 'destructive',
      });
      return;
    }

    // Create the group (returning id if allowed)
    const { data: inserted, error: insertError } = await supabase
      .from('study_groups')
      .insert({
        class_id: enrollments[0].class_id,
        name: newGroup.name,
        description: newGroup.description,
        max_members: newGroup.maxMembers,
        created_by: user.id,
        is_public: true,
      })
      .select('id')
      .maybeSingle();

    if (insertError) {
      console.error('Study group creation error:', insertError);
      console.error('Error code:', insertError.code);
      console.error('Error details:', insertError.details);
      console.error('Error hint:', insertError.hint);
      toast({
        title: 'Error',
        description: `Failed to create study group: ${insertError.code || ''} ${insertError.message}`,
        variant: 'destructive',
      });
      return;
    }

    let groupId = inserted?.id as string | undefined;

    if (!groupId) {
      // Fallback: fetch the most recent group created by this user
      const { data: latest, error: latestError } = await supabase
        .from('study_groups')
        .select('id')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestError || !latest) {
        toast({
          title: 'Error',
          description: `Group created but could not retrieve ID: ${latestError?.code || ''} ${latestError?.message || ''}`,
          variant: 'destructive',
        });
        return;
      }
      groupId = latest.id;
    }

    const { error: memberError } = await supabase.from('study_group_members').insert({
      group_id: groupId,
      student_id: user.id,
      role: 'creator',
    });

    if (memberError) {
      console.error('Member add error:', memberError);
      toast({
        title: 'Warning',
        description: `Group created but failed to add you as member: ${memberError.code || ''} ${memberError.message}`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Study group created successfully',
      });
    }

    setCreateDialogOpen(false);
    setNewGroup({ name: '', description: '', maxMembers: 6 });
    fetchGroups();
  };

  const joinGroup = async (groupId: string) => {
    if (!user) return;

    const { error } = await supabase.from('study_group_members').insert({
      group_id: groupId,
      student_id: user.id,
      role: 'member',
    });

    if (error) {
      toast({
        title: 'Error',
        description: `Failed to join group: ${error.code || ''} ${error.message}`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Joined study group successfully',
      });
      fetchGroups();
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('study_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('student_id', user.id);

    if (error) {
      toast({
        title: 'Error',
        description: `Failed to leave group: ${error.code || ''} ${error.message}`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Left study group successfully',
      });
      fetchGroups();
    }
  };

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(search.toLowerCase()) ||
      group.description?.toLowerCase().includes(search.toLowerCase())
  );

  const myGroups = filteredGroups.filter(g => g.is_member);
  const discoverGroups = filteredGroups.filter(g => !g.is_member);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/student/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Study Groups</h1>
            <p className="text-muted-foreground">Find and join study groups</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Study Group</DialogTitle>
                <DialogDescription>Create a new study group for your class</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name</Label>
                  <Input
                    id="name"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    placeholder="e.g., CS101 Study Group"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                    placeholder="Describe your study group..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxMembers">Max Members</Label>
                  <Input
                    id="maxMembers"
                    type="number"
                    value={newGroup.maxMembers}
                    onChange={(e) => setNewGroup({ ...newGroup, maxMembers: parseInt(e.target.value) })}
                    min={2}
                    max={20}
                  />
                </div>
                <Button onClick={createGroup} className="w-full">Create Group</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search study groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : filteredGroups.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No study groups found
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* My Groups Section */}
            {myGroups.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3">My Groups</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myGroups.map((group) => (
                    <Card key={group.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{group.name}</CardTitle>
                            <CardDescription className="mt-1">{group.description}</CardDescription>
                          </div>
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {group.member_count !== undefined ? `${group.member_count}/${group.max_members}` : '–'} members
                            </Badge>
                            {group.is_public && <Badge>Public</Badge>}
                            {group.is_creator && <Badge variant="default">Creator</Badge>}
                          </div>
                          <div className="flex items-center gap-2">
                            {group.is_creator && (
                              <AddGroupMembers 
                                groupId={group.id} 
                                onMemberAdded={fetchGroups}
                              />
                            )}
                            {!group.is_creator && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => leaveGroup(group.id)}
                              >
                                Leave
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Discover Section */}
            {discoverGroups.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-3">Discover Groups</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {discoverGroups.map((group) => (
                    <Card key={group.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{group.name}</CardTitle>
                            <CardDescription className="mt-1">{group.description}</CardDescription>
                          </div>
                          <Users className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {group.member_count !== undefined ? `${group.member_count}/${group.max_members}` : '–'} members
                            </Badge>
                            {group.is_public && <Badge>Public</Badge>}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => joinGroup(group.id)}
                            disabled={(group.member_count || 0) >= group.max_members}
                          >
                            Join
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
