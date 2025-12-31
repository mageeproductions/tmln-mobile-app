/*
  # Fix Feedback Image Storage Access

  1. Changes
    - Update event-media bucket to be public so images can be viewed
    - Keep upload restrictions in place
    - Images won't be displayed in the UI, but can be accessed directly by TMLN staff

  2. Security
    - Only authenticated users can upload to feedback folder
    - Images are publicly accessible via URL (for TMLN staff access)
    - Images are not displayed in the public feedback UI
*/

-- Update bucket to be public
UPDATE storage.buckets
SET public = true
WHERE id = 'event-media';

-- Drop the restrictive view policy
DROP POLICY IF EXISTS "Users can view their own feedback images" ON storage.objects;

-- Create a policy that allows anyone to view feedback images (via direct URL)
-- This allows TMLN staff to view images while keeping them hidden from the UI
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow viewing feedback images via URL'
  ) THEN
    CREATE POLICY "Allow viewing feedback images via URL"
    ON storage.objects
    FOR SELECT
    TO public
    USING (
      bucket_id = 'event-media' AND
      (storage.foldername(name))[1] = 'feedback'
    );
  END IF;
END $$;
