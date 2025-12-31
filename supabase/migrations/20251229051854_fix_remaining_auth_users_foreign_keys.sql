/*
  # Fix Remaining Foreign Keys to Use Profiles

  1. Changes
    - Update foreign keys that reference auth.users to reference profiles instead
    - Affected tables:
      - event_contacts.user_id
      - event_vendor_invitations.vendor_id
      - event_vendor_invitations.invited_by
      - push_notification_tokens.user_id
      - timeline_notifications.sent_to_user_id
      - message_read_receipts.user_id
      - message_notifications.sent_to_user_id
      - event_vendors.invited_by

  2. Benefits
    - Enables proper joins with profiles table
    - Maintains referential integrity through profiles table
    - Fixes "Could not find relationship" errors in queries

  3. Security
    - No changes to RLS policies needed
    - Maintains existing security model
*/

-- event_contacts.user_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'event_contacts_user_id_fkey' 
    AND table_name = 'event_contacts'
  ) THEN
    ALTER TABLE event_contacts DROP CONSTRAINT event_contacts_user_id_fkey;
    ALTER TABLE event_contacts 
    ADD CONSTRAINT event_contacts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- event_vendor_invitations.vendor_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'event_vendor_invitations_vendor_id_fkey' 
    AND table_name = 'event_vendor_invitations'
  ) THEN
    ALTER TABLE event_vendor_invitations DROP CONSTRAINT event_vendor_invitations_vendor_id_fkey;
    ALTER TABLE event_vendor_invitations 
    ADD CONSTRAINT event_vendor_invitations_vendor_id_fkey 
    FOREIGN KEY (vendor_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- event_vendor_invitations.invited_by
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'event_vendor_invitations_invited_by_fkey' 
    AND table_name = 'event_vendor_invitations'
  ) THEN
    ALTER TABLE event_vendor_invitations DROP CONSTRAINT event_vendor_invitations_invited_by_fkey;
    ALTER TABLE event_vendor_invitations 
    ADD CONSTRAINT event_vendor_invitations_invited_by_fkey 
    FOREIGN KEY (invited_by) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- push_notification_tokens.user_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'push_notification_tokens_user_id_fkey' 
    AND table_name = 'push_notification_tokens'
  ) THEN
    ALTER TABLE push_notification_tokens DROP CONSTRAINT push_notification_tokens_user_id_fkey;
    ALTER TABLE push_notification_tokens 
    ADD CONSTRAINT push_notification_tokens_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- timeline_notifications.sent_to_user_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'timeline_notifications_sent_to_user_id_fkey' 
    AND table_name = 'timeline_notifications'
  ) THEN
    ALTER TABLE timeline_notifications DROP CONSTRAINT timeline_notifications_sent_to_user_id_fkey;
    ALTER TABLE timeline_notifications 
    ADD CONSTRAINT timeline_notifications_sent_to_user_id_fkey 
    FOREIGN KEY (sent_to_user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- message_read_receipts.user_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'message_read_receipts_user_id_fkey' 
    AND table_name = 'message_read_receipts'
  ) THEN
    ALTER TABLE message_read_receipts DROP CONSTRAINT message_read_receipts_user_id_fkey;
    ALTER TABLE message_read_receipts 
    ADD CONSTRAINT message_read_receipts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- message_notifications.sent_to_user_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'message_notifications_sent_to_user_id_fkey' 
    AND table_name = 'message_notifications'
  ) THEN
    ALTER TABLE message_notifications DROP CONSTRAINT message_notifications_sent_to_user_id_fkey;
    ALTER TABLE message_notifications 
    ADD CONSTRAINT message_notifications_sent_to_user_id_fkey 
    FOREIGN KEY (sent_to_user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- event_vendors.invited_by
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'event_vendors_invited_by_fkey' 
    AND table_name = 'event_vendors'
  ) THEN
    ALTER TABLE event_vendors DROP CONSTRAINT event_vendors_invited_by_fkey;
    ALTER TABLE event_vendors 
    ADD CONSTRAINT event_vendors_invited_by_fkey 
    FOREIGN KEY (invited_by) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;