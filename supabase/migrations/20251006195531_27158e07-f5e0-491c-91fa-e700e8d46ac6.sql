-- Study group members RLS improvements to allow creators to invite/add other students and view memberships

-- Allow creators to INSERT members into their own groups
CREATE POLICY "Creators can add members to their groups"
ON public.study_group_members
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.study_groups g
    WHERE g.id = study_group_members.group_id
      AND g.created_by = auth.uid()
  )
);

-- Allow creators to SELECT members of their own groups
CREATE POLICY "Creators can view members of their groups"
ON public.study_group_members
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.study_groups g
    WHERE g.id = study_group_members.group_id
      AND g.created_by = auth.uid()
  )
);
