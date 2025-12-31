/*
  # Setup Feedback Image Storage

  1. Storage Configuration
    - Ensures 'event-media' bucket exists for feedback images
    - Sets up storage policies to allow authenticated users to upload
    - Restricts public access to feedback images

  2. Security
    - Only authenticated users can upload images
    - Images are stored under feedback/ path
    - Images are only accessible by the uploader and admins
*/

-- Ensure the event-media bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-media', 'event-media', false)
ON CONFLICT (id) DO UPDATE
SET public = false;

-- Policy: Allow authenticated users to upload to feedback folder
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Allow authenticated uploads to feedback'
  ) THEN
    CREATE POLICY "Allow authenticated uploads to feedback"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'event-media' AND
      (storage.foldername(name))[1] = 'feedback'
    );
  END IF;
END $$;

-- Policy: Allow users to view their own uploaded feedback images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can view their own feedback images'
  ) THEN
    CREATE POLICY "Users can view their own feedback images"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'event-media' AND
      (storage.foldername(name))[1] = 'feedback' AND
      owner = auth.uid()
    );
  END IF;
END $$;

-- Policy: Allow users to delete their own feedback images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete their own feedback images'
  ) THEN
    CREATE POLICY "Users can delete their own feedback images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'event-media' AND
      (storage.foldername(name))[1] = 'feedback' AND
      owner = auth.uid()
    );
  END IF;
END $$;
