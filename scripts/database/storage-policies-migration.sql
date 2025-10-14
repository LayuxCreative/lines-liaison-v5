-- Storage Policies Migration
-- This file contains the SQL commands needed to set up storage policies
-- Apply this manually in the Supabase SQL Editor with service role permissions

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to upload files to uploads bucket
CREATE POLICY "Allow authenticated uploads to uploads bucket"
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'uploads');

-- Policy to allow public access to view files in uploads bucket
CREATE POLICY "Allow public access to uploads bucket"
ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'uploads');

-- Policy to allow authenticated users to update files in uploads bucket
CREATE POLICY "Allow authenticated updates to uploads bucket"
ON storage.objects
FOR UPDATE 
TO authenticated
USING (bucket_id = 'uploads')
WITH CHECK (bucket_id = 'uploads');

-- Policy to allow authenticated users to delete files in uploads bucket
CREATE POLICY "Allow authenticated deletes from uploads bucket"
ON storage.objects
FOR DELETE 
TO authenticated
USING (bucket_id = 'uploads');

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';