/*
  # Fix Event Vendors Insert Policy

  1. Problem
    - Current INSERT policy only allows event creators to add vendors
    - Event members (planners, vendors) cannot add other vendors to events
    - This causes "Failed to add vendors" error for non-creator members
    
  2. Solution
    - Update INSERT policy to allow both event creators AND event members to add vendors
    - Check if user is either the creator OR a member of the event
    
  3. Changes
    - Drop existing restrictive INSERT policy
    - Create new policy that checks event membership
*/

-- Drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Event creators can add vendors" ON event_vendors;

-- Create new policy allowing event members to add vendors
CREATE POLICY "Event members can add vendors"
  ON event_vendors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User is the event creator
    is_event_creator(event_id)
    OR
    -- User is an event member
    EXISTS (
      SELECT 1
      FROM event_members
      WHERE event_members.event_id = event_vendors.event_id
      AND event_members.user_id = auth.uid()
    )
  );
