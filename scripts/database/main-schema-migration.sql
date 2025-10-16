-- Main Database Schema Migration for Lines Liaison V5
-- Creates all core tables with proper relationships and RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  bio text,
  department text,
  position text,
  phone text,
  location text,
  website text,
  role text DEFAULT 'team_member' CHECK (role IN ('admin', 'project_manager', 'team_member', 'client')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  is_online boolean DEFAULT false,
  last_seen timestamptz,
  last_seen_at timestamptz,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  two_factor_enabled boolean DEFAULT false,
  preferences jsonb DEFAULT '{}'::jsonb,
  additional_permissions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  category text CHECK (category IN ('BIM', 'ICE', 'Structural', 'MEP', 'Civil', 'Industrial', 'Training')),
  status text DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'review', 'completed', 'on_hold')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  client_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  manager_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  team_members text[] DEFAULT '{}',
  start_date date,
  end_date date,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  budget numeric(12,2),
  spent numeric(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  assignee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  assignee_name text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'completed', 'cancelled')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  due_date timestamptz,
  estimated_hours numeric(8,2),
  actual_hours numeric(8,2),
  tags text[] DEFAULT '{}',
  dependencies text[] DEFAULT '{}',
  attached_files text[] DEFAULT '{}',
  clickup_task_id text,
  clickup_url text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  content text NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  reply_to uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  type text DEFAULT 'text' CHECK (type IN ('text', 'file', 'image', 'system')),
  message_type text,
  attachments text[] DEFAULT '{}',
  file_name text,
  file_size bigint,
  file_url text,
  edited_at timestamptz,
  created_at timestamptz DEFAULT now(),
  timestamp timestamptz DEFAULT now()
);

-- Create files table
CREATE TABLE IF NOT EXISTS public.files (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  url text NOT NULL,
  type text NOT NULL,
  size bigint,
  category text,
  tags text[] DEFAULT '{}',
  version integer DEFAULT 1,
  is_external boolean DEFAULT false,
  external_url text,
  is_approved boolean DEFAULT false,
  thumbnail text,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  uploaded_at timestamptz DEFAULT now(),
  last_modified timestamptz DEFAULT now(),
  last_modified_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  download_count integer DEFAULT 0,
  view_count integer DEFAULT 0
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text CHECK (type IN ('info', 'success', 'warning', 'error')),
  action_url text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create activities table
CREATE TABLE IF NOT EXISTS public.activities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  action text NOT NULL,
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz DEFAULT now()
);

-- Create permission_groups table
CREATE TABLE IF NOT EXISTS public.permission_groups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  permissions text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  device_info jsonb DEFAULT '{}'::jsonb,
  user_agent text,
  ip_address inet,
  is_active boolean DEFAULT true,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON public.projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_messages_project ON public.messages(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_files_project ON public.files(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_project ON public.activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON public.activities(user_id);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for teams
CREATE POLICY "Users can view teams they belong to" ON public.teams FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = teams.id AND user_id = auth.uid()
  )
);
CREATE POLICY "Team admins can update teams" ON public.teams FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = teams.id AND user_id = auth.uid() AND role = 'admin'
  )
);
CREATE POLICY "Authenticated users can create teams" ON public.teams FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create RLS policies for projects
CREATE POLICY "Users can view projects they have access to" ON public.projects FOR SELECT USING (
  manager_id = auth.uid() OR 
  client_id = auth.uid() OR 
  auth.uid()::text = ANY(team_members)
);
CREATE POLICY "Project managers can update projects" ON public.projects FOR UPDATE USING (manager_id = auth.uid());
CREATE POLICY "Authenticated users can create projects" ON public.projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create RLS policies for tasks
CREATE POLICY "Users can view tasks in accessible projects" ON public.tasks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = tasks.project_id AND (
      manager_id = auth.uid() OR 
      client_id = auth.uid() OR 
      auth.uid()::text = ANY(team_members)
    )
  )
);
CREATE POLICY "Users can update tasks assigned to them or in managed projects" ON public.tasks FOR UPDATE USING (
  assignee_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = tasks.project_id AND manager_id = auth.uid()
  )
);
CREATE POLICY "Users can create tasks in accessible projects" ON public.tasks FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = tasks.project_id AND (
      manager_id = auth.uid() OR 
      auth.uid()::text = ANY(team_members)
    )
  )
);

-- Create RLS policies for messages
CREATE POLICY "Users can view messages in accessible projects/teams" ON public.messages FOR SELECT USING (
  (project_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = messages.project_id AND (
      manager_id = auth.uid() OR 
      client_id = auth.uid() OR 
      auth.uid()::text = ANY(team_members)
    )
  )) OR
  (team_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.team_members 
    WHERE team_id = messages.team_id AND user_id = auth.uid()
  ))
);
CREATE POLICY "Users can insert messages in accessible projects/teams" ON public.messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND (
    (project_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = messages.project_id AND (
        manager_id = auth.uid() OR 
        client_id = auth.uid() OR 
        auth.uid()::text = ANY(team_members)
      )
    )) OR
    (team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.team_members 
      WHERE team_id = messages.team_id AND user_id = auth.uid()
    ))
  )
);

-- Create RLS policies for files
CREATE POLICY "Users can view files in accessible projects" ON public.files FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = files.project_id AND (
      manager_id = auth.uid() OR 
      client_id = auth.uid() OR 
      auth.uid()::text = ANY(team_members)
    )
  )
);
CREATE POLICY "Users can upload files to accessible projects" ON public.files FOR INSERT WITH CHECK (
  uploaded_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = files.project_id AND (
      manager_id = auth.uid() OR 
      auth.uid()::text = ANY(team_members)
    )
  )
);

-- Create RLS policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Create RLS policies for activities
CREATE POLICY "Users can view activities in accessible projects" ON public.activities FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = activities.project_id AND (
      manager_id = auth.uid() OR 
      client_id = auth.uid() OR 
      auth.uid()::text = ANY(team_members)
    )
  )
);
CREATE POLICY "System can create activities" ON public.activities FOR INSERT WITH CHECK (true);

-- Create functions
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE role = 'admin'
  );
$$;

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.permission_groups FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();