-- Role-based RLS policies for core tables

-- TEAMS
alter table if exists public.teams enable row level security;
drop policy if exists "Admins can manage teams" on public.teams;
drop policy if exists "Team creator can manage team" on public.teams;
drop policy if exists "Team members can read team" on public.teams;
create policy "Admins can manage teams"
  on public.teams
  for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "Team creator can manage team"
  on public.teams
  for all
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());
create policy "Team members can read team"
  on public.teams
  for select
  to authenticated
  using (exists (
    select 1
    from public.team_members tm
    where tm.team_id = teams.id and tm.user_id = auth.uid()
  ));

-- TEAM_MEMBERS
alter table if exists public.team_members enable row level security;
drop policy if exists "Admins can manage team_members" on public.team_members;
drop policy if exists "Users can view their memberships" on public.team_members;
drop policy if exists "Team creator can manage memberships" on public.team_members;
drop policy if exists "Users can leave team" on public.team_members;
create policy "Admins can manage team_members"
  on public.team_members
  for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "Users can view their memberships"
  on public.team_members
  for select
  to authenticated
  using (user_id = auth.uid());
create policy "Team creator can manage memberships"
  on public.team_members
  for all
  to authenticated
  using (exists (
    select 1
    from public.teams t
    where t.id = team_members.team_id and t.created_by = auth.uid()
  ))
  with check (exists (
    select 1
    from public.teams t
    where t.id = team_members.team_id and t.created_by = auth.uid()
  ));
create policy "Users can leave team"
  on public.team_members
  for delete
  to authenticated
  using (user_id = auth.uid());

-- PROJECTS
alter table if exists public.projects enable row level security;
drop policy if exists "Admins can manage projects" on public.projects;
drop policy if exists "Manager can manage project" on public.projects;
drop policy if exists "Client can read project" on public.projects;
create policy "Admins can manage projects"
  on public.projects
  for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "Manager can manage project"
  on public.projects
  for all
  to authenticated
  using (manager_id = auth.uid())
  with check (manager_id = auth.uid());
create policy "Client can read project"
  on public.projects
  for select
  to authenticated
  using (client_id = auth.uid());

-- TASKS
alter table if exists public.tasks enable row level security;
drop policy if exists "Admins can manage tasks" on public.tasks;
drop policy if exists "Assignee or creator can read tasks" on public.tasks;
drop policy if exists "Assignee or creator can update tasks" on public.tasks;
drop policy if exists "Project manager can read tasks" on public.tasks;
drop policy if exists "Project manager can update tasks" on public.tasks;
create policy "Admins can manage tasks"
  on public.tasks
  for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "Assignee or creator can read tasks"
  on public.tasks
  for select
  to authenticated
  using (assignee_id = auth.uid() or created_by = auth.uid());
create policy "Assignee or creator can update tasks"
  on public.tasks
  for update
  to authenticated
  using (assignee_id = auth.uid() or created_by = auth.uid())
  with check (assignee_id = auth.uid() or created_by = auth.uid());
create policy "Project manager can read tasks"
  on public.tasks
  for select
  to authenticated
  using (exists (
    select 1
    from public.projects p
    where p.id = tasks.project_id and p.manager_id = auth.uid()
  ));
create policy "Project manager can update tasks"
  on public.tasks
  for update
  to authenticated
  using (exists (
    select 1
    from public.projects p
    where p.id = tasks.project_id and p.manager_id = auth.uid()
  ))
  with check (exists (
    select 1
    from public.projects p
    where p.id = tasks.project_id and p.manager_id = auth.uid()
  ));

-- ACTIVITIES
alter table if exists public.activities enable row level security;
drop policy if exists "Admins can read activities" on public.activities;
drop policy if exists "User can view own activities" on public.activities;
drop policy if exists "Project manager can view project activities" on public.activities;
drop policy if exists "User can insert own activities" on public.activities;
drop policy if exists "Admins can modify activities" on public.activities;
create policy "Admins can read activities"
  on public.activities
  for select
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "User can view own activities"
  on public.activities
  for select
  to authenticated
  using (user_id = auth.uid());
create policy "Project manager can view project activities"
  on public.activities
  for select
  to authenticated
  using (exists (
    select 1
    from public.projects p
    where p.id = activities.project_id and p.manager_id = auth.uid()
  ));
create policy "User can insert own activities"
  on public.activities
  for insert
  to authenticated
  with check (user_id = auth.uid());
create policy "Admins can modify activities"
  on public.activities
  for update
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- FILES
alter table if exists public.files enable row level security;
drop policy if exists "Admins can manage files" on public.files;
drop policy if exists "Uploader can read files" on public.files;
drop policy if exists "Uploader can update files" on public.files;
drop policy if exists "Uploader can delete own files" on public.files;
drop policy if exists "Project manager can read files" on public.files;
drop policy if exists "Project manager can update files" on public.files;
drop policy if exists "Users can insert own files" on public.files;
create policy "Admins can manage files"
  on public.files
  for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "Uploader can read files"
  on public.files
  for select
  to authenticated
  using (uploaded_by = auth.uid());
create policy "Uploader can update files"
  on public.files
  for update
  to authenticated
  using (uploaded_by = auth.uid() or last_modified_by = auth.uid())
  with check (uploaded_by = auth.uid() or last_modified_by = auth.uid());
create policy "Uploader can delete own files"
  on public.files
  for delete
  to authenticated
  using (uploaded_by = auth.uid());
create policy "Project manager can read files"
  on public.files
  for select
  to authenticated
  using (exists (
    select 1
    from public.projects p
    where p.id = files.project_id and p.manager_id = auth.uid()
  ));
create policy "Project manager can update files"
  on public.files
  for update
  to authenticated
  using (exists (
    select 1
    from public.projects p
    where p.id = files.project_id and p.manager_id = auth.uid()
  ))
  with check (exists (
    select 1
    from public.projects p
    where p.id = files.project_id and p.manager_id = auth.uid()
  ));
create policy "Users can insert own files"
  on public.files
  for insert
  to authenticated
  with check (uploaded_by = auth.uid());

-- NOTIFICATIONS
alter table if exists public.notifications enable row level security;
drop policy if exists "Admins can manage notifications" on public.notifications;
drop policy if exists "Users can read own notifications" on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;
drop policy if exists "Users can insert own notifications" on public.notifications;
create policy "Admins can manage notifications"
  on public.notifications
  for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "Users can read own notifications"
  on public.notifications
  for select
  to authenticated
  using (user_id = auth.uid());
create policy "Users can update own notifications"
  on public.notifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "Users can insert own notifications"
  on public.notifications
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- USER_SESSIONS
alter table if exists public.user_sessions enable row level security;
drop policy if exists "Admins can read user sessions" on public.user_sessions;
drop policy if exists "User can manage own sessions" on public.user_sessions;
drop policy if exists "User can insert own session" on public.user_sessions;
drop policy if exists "User can delete own session" on public.user_sessions;
create policy "Admins can read user sessions"
  on public.user_sessions
  for select
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "User can manage own sessions"
  on public.user_sessions
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "User can insert own session"
  on public.user_sessions
  for insert
  to authenticated
  with check (user_id = auth.uid());
create policy "User can delete own session"
  on public.user_sessions
  for delete
  to authenticated
  using (user_id = auth.uid());

-- PERMISSION_GROUPS
alter table if exists public.permission_groups enable row level security;
drop policy if exists "Admins can manage permission_groups" on public.permission_groups;
drop policy if exists "Users can read active permission_groups" on public.permission_groups;
create policy "Admins can manage permission_groups"
  on public.permission_groups
  for all
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
create policy "Users can read active permission_groups"
  on public.permission_groups
  for select
  to authenticated
  using (is_active = true);