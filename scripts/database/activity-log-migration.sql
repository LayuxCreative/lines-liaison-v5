-- Activity Log Migration
-- Creates activity_log table for tracking user activities with RLS policies

-- Create activity_log table
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  actor_email text,
  event_type text NOT NULL CHECK (event_type IN ('login','logout','profile_updated','project_created','file_uploaded')),
  target_id text,
  target_type text,
  metadata jsonb DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_activity_user_time ON public.activity_log (user_id, occurred_at DESC);

-- Enable RLS
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "read-own" ON public.activity_log 
FOR SELECT TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "insert-own" ON public.activity_log 
FOR INSERT TO authenticated 
WITH CHECK (user_id = auth.uid());

-- Add foreign key constraint to profiles table
ALTER TABLE public.activity_log 
ADD CONSTRAINT activity_log_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;