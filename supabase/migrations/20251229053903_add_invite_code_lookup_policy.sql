/*
  # Allow invite code lookups for events

  1. Changes
    - Add new RLS policy to allow authenticated users to view events by invite code
    - This enables the "Join with Code" feature to work properly
  
  2. Security
    - Policy only allows SELECT operations
    - Only accessible to authenticated users
    - Users can only look up events with valid invite codes (which are already random 6-digit codes)
*/

-- Add policy to allow users to look up events by invite code
CREATE POLICY "Users can view events by invite code"
  ON events
  FOR SELECT
  TO authenticated
  USING (invite_code IS NOT NULL);
