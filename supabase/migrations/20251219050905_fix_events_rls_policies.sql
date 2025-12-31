/*
  # Fix Events Table RLS Policies

  1. Changes
    - Drop and recreate all RLS policies on the events table
    - Simplify the SELECT policy to avoid column reference errors
    - Ensure policies properly reference the correct columns
    
  2. Security
    - Users can only view events they created or are members of
    - Users can only create events with themselves as creator
    - Users can only update events they created or are members of
    - Users can only delete events they created
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view events" ON events;
DROP POLICY IF EXISTS "Users can create events" ON events;
DROP POLICY IF EXISTS "Users can update events" ON events;
DROP POLICY IF EXISTS "Users can delete own events" ON events;

-- Create new simplified policies
CREATE POLICY "Users can view events"
  ON events FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM event_members
      WHERE event_members.event_id = events.id
      AND event_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM event_members
      WHERE event_members.event_id = events.id
      AND event_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM event_members
      WHERE event_members.event_id = events.id
      AND event_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own events"
  ON events FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());
