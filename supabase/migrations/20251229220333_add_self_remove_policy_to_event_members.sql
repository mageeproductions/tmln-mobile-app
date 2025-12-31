/*
  # Add Self-Remove Policy for Event Members

  1. Changes
    - Add a new DELETE policy to allow users to remove themselves from events
    - This enables the "Remove from dashboard" feature to work for all users, not just event creators

  2. Security
    - Users can only delete their own membership records (where user_id = auth.uid())
    - Event creators can still remove any member (existing policy remains)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'event_members' 
    AND policyname = 'Users can remove themselves from events'
  ) THEN
    CREATE POLICY "Users can remove themselves from events"
      ON event_members
      FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;
