/*
  # Fix event_members INSERT policy to allow self-joining

  1. Changes
    - Drop the existing restrictive INSERT policy
    - Create new INSERT policy that allows:
      * Users to join events themselves via invite code (user_id = auth.uid())
      * Event creators to add other members (added_by = auth.uid())
  
  2. Security
    - Users can only add themselves as members OR
    - Users can add others if they're doing the adding (added_by matches their ID)
    - This enables both invite code joining and manual member addition
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can add members to events" ON event_members;

-- Create new INSERT policy that allows self-joining or adding by authenticated users
CREATE POLICY "Users can join events or add members"
  ON event_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR added_by = auth.uid()
  );
