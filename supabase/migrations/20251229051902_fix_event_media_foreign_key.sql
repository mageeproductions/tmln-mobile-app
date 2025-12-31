/*
  # Fix Event Media Foreign Key

  1. Changes
    - Drop existing foreign key from event_media.uploaded_by to auth.users.id
    - Create new foreign key from event_media.uploaded_by to profiles.id

  2. Benefits
    - Enables proper joins with profiles table
    - Maintains referential integrity through profiles table
    - Consistent with other table foreign keys

  3. Security
    - No changes to RLS policies needed
    - Maintains existing security model
*/

-- Drop existing foreign key
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'event_media_uploaded_by_fkey' 
    AND table_name = 'event_media'
  ) THEN
    ALTER TABLE event_media DROP CONSTRAINT event_media_uploaded_by_fkey;
    ALTER TABLE event_media 
    ADD CONSTRAINT event_media_uploaded_by_fkey 
    FOREIGN KEY (uploaded_by) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;