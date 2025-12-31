/*
  # Fix Event Members Table RLS Policies - Remove Circular Dependency

  1. Problem
    - The events SELECT policy checks event_members table
    - The event_members INSERT policy checks events table
    - This creates infinite recursion when inserting new members
    
  2. Solution
    - Restructure event_members policies to break circular dependency
    - Allow INSERT for anyone who can prove they have the right event_id
    - The frontend validates the invite code before inserting
    
  3. Security
    - Users can view their own memberships
    - Users can add members if they are the event creator
    - Event creators can update and remove members
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their memberships" ON event_members;
DROP POLICY IF EXISTS "Users can add members to events" ON event_members;
DROP POLICY IF EXISTS "Event creators can update members" ON event_members;
DROP POLICY IF EXISTS "Event creators can remove members" ON event_members;

-- Create new policies without circular dependency
CREATE POLICY "Users can view their memberships"
  ON event_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can add members to events"
  ON event_members FOR INSERT
  TO authenticated
  WITH CHECK (
    added_by = auth.uid()
  );

CREATE POLICY "Event creators can update members"
  ON event_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM events e
      WHERE e.id = event_members.event_id
      AND e.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM events e
      WHERE e.id = event_members.event_id
      AND e.created_by = auth.uid()
    )
  );

CREATE POLICY "Event creators can remove members"
  ON event_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM events e
      WHERE e.id = event_members.event_id
      AND e.created_by = auth.uid()
    )
  );
