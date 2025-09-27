-- Fix RLS Performance Issues
-- This migration optimizes RLS policies for better performance

-- 1. Fix auth function calls in profiles table
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE USING ((select auth.uid()) = id);

-- 2. Consolidate multiple permissive policies for activities table
DROP POLICY IF EXISTS "Users can view activities" ON public.activities;
DROP POLICY IF EXISTS "Users can view all activities" ON public.activities;
CREATE POLICY "Users can view activities" ON public.activities
FOR SELECT USING (
  user_id = (select auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

-- 3. Consolidate multiple permissive policies for messages table
DROP POLICY IF EXISTS "Users can view messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their projects" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their teams" ON public.messages;
CREATE POLICY "Users can view messages" ON public.messages
FOR SELECT USING (
  sender_id = (select auth.uid()) OR
  project_id IN (
    SELECT id FROM public.projects 
    WHERE manager_id = (select auth.uid()) OR 
    (select auth.uid()) = ANY(team_members)
  ) OR
  team_id IN (
    SELECT team_id FROM public.team_members 
    WHERE user_id = (select auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can send messages to their projects" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their teams" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
FOR INSERT WITH CHECK (
  sender_id = (select auth.uid()) AND (
    project_id IN (
      SELECT id FROM public.projects 
      WHERE manager_id = (select auth.uid()) OR 
      (select auth.uid()) = ANY(team_members)
    ) OR
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = (select auth.uid())
    )
  )
);

-- 4. Consolidate multiple permissive policies for notifications table
DROP POLICY IF EXISTS "Users can view accessible notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view notifications" ON public.notifications
FOR SELECT USING (
  user_id = (select auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can insert notifications for any user" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications" ON public.notifications
FOR INSERT WITH CHECK (
  user_id = (select auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = (select auth.uid()) AND role = 'admin'
  )
);

-- 5. Remove unused indexes to improve performance
DROP INDEX IF EXISTS idx_team_members_team_id;
DROP INDEX IF EXISTS idx_messages_team_id;
DROP INDEX IF EXISTS idx_permission_groups_name;
DROP INDEX IF EXISTS idx_permission_groups_active;
DROP INDEX IF EXISTS idx_activities_user_id;
DROP INDEX IF EXISTS idx_activities_project_id;
DROP INDEX IF EXISTS idx_messages_project_id;
DROP INDEX IF EXISTS idx_tasks_assignee_id;
DROP INDEX IF EXISTS idx_user_sessions_user_id;
DROP INDEX IF EXISTS idx_user_sessions_token;
DROP INDEX IF EXISTS idx_messages_reply_to;
DROP INDEX IF EXISTS idx_tasks_project_id;
DROP INDEX IF EXISTS idx_tasks_created_by;
DROP INDEX IF EXISTS idx_projects_client_id;
DROP INDEX IF EXISTS idx_profiles_last_seen;
DROP INDEX IF EXISTS idx_files_last_modified_by;
DROP INDEX IF EXISTS idx_files_uploaded_by;
DROP INDEX IF EXISTS idx_projects_manager_id;
DROP INDEX IF EXISTS idx_teams_created_by;

-- 6. Create only necessary indexes for actual queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_projects_manager_team ON public.projects(manager_id, team_members);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status ON public.tasks(assignee_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_project_sender ON public.messages(project_id, sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);