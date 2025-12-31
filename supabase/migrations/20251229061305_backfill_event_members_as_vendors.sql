/*
  # Backfill Event Members as Vendors

  1. Problem
    - Existing event members were not added to event_vendors table
    - The trigger only affects NEW inserts after it was created
    - Users who are event members but not in vendors table won't show up in the Vendors card
    
  2. Solution
    - Backfill all existing event members into event_vendors table
    - Set them as vendor_type 'member' with 'accepted' status
    - Skip any that already exist (ON CONFLICT DO NOTHING)
    
  3. Changes
    - Insert all event_members who don't have a corresponding event_vendors entry
*/

-- Backfill existing event members into event_vendors table
INSERT INTO event_vendors (event_id, user_id, vendor_type, invitation_status, invited_by)
SELECT 
  em.event_id,
  em.user_id,
  'member' as vendor_type,
  'accepted' as invitation_status,
  em.added_by
FROM event_members em
WHERE NOT EXISTS (
  SELECT 1 
  FROM event_vendors ev 
  WHERE ev.event_id = em.event_id 
  AND ev.user_id = em.user_id
)
ON CONFLICT (event_id, user_id) DO NOTHING;
