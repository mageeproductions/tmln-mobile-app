/*
  # Fix sync_event_vendors_to_contacts Function

  1. Problem
    - Function references e.user_id which doesn't exist in events table
    - The correct column name is e.created_by
    
  2. Solution
    - Update function to use e.created_by instead of e.user_id
*/

CREATE OR REPLACE FUNCTION sync_event_vendors_to_contacts(p_event_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
v_vendor RECORD;
BEGIN
-- Get all other vendors from the event that are app users
FOR v_vendor IN
SELECT DISTINCT ev.user_id
FROM event_vendors ev
WHERE ev.event_id = p_event_id
AND ev.user_id IS NOT NULL
AND ev.user_id != p_user_id
AND ev.invitation_status = 'accepted'
LOOP
-- Add to current user's contacts if not exists
INSERT INTO contacts (user_id, contact_user_id)
VALUES (p_user_id, v_vendor.user_id)
ON CONFLICT (user_id, contact_user_id) DO NOTHING;

-- Add current user to vendor's contacts (bidirectional)
INSERT INTO contacts (user_id, contact_user_id)
VALUES (v_vendor.user_id, p_user_id)
ON CONFLICT (user_id, contact_user_id) DO NOTHING;
END LOOP;

-- Also sync with the event creator/owner (FIXED: use created_by instead of user_id)
INSERT INTO contacts (user_id, contact_user_id)
SELECT p_user_id, e.created_by
FROM events e
WHERE e.id = p_event_id
AND e.created_by != p_user_id
ON CONFLICT (user_id, contact_user_id) DO NOTHING;

INSERT INTO contacts (user_id, contact_user_id)
SELECT e.created_by, p_user_id
FROM events e
WHERE e.id = p_event_id
AND e.created_by != p_user_id
ON CONFLICT (user_id, contact_user_id) DO NOTHING;
END;
$$;
