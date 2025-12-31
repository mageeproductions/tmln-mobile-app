/*
  # Fix Event Vendor Invitations Insert Policy

  1. Problem
    - Current INSERT policy only verifies that invited_by matches auth.uid()
    - Does not check if the user is actually part of the event (creator or member)
    - Users could send invitations for events they're not part of
    
  2. Solution
    - Update INSERT policy to verify user is event creator OR event member
    - Maintain security while allowing proper collaboration
    
  3. Changes
    - Drop existing INSERT policy
    - Create new policy that checks event membership/ownership
*/

-- Drop the current INSERT policy
DROP POLICY IF EXISTS "Event creators can create invitations" ON event_vendor_invitations;

-- Create new policy allowing event creators and members to send invitations
CREATE POLICY "Event members can create invitations"
  ON event_vendor_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    invited_by = auth.uid()
    AND (
      -- User is the event creator
      EXISTS (
        SELECT 1
        FROM events
        WHERE events.id = event_vendor_invitations.event_id
        AND events.created_by = auth.uid()
      )
      OR
      -- User is an event member
      EXISTS (
        SELECT 1
        FROM event_members
        WHERE event_members.event_id = event_vendor_invitations.event_id
        AND event_members.user_id = auth.uid()
      )
    )
  );
