/*
  # Fix Security and Performance Issues

  1. RLS Performance Optimization
    - Optimize 6 RLS policies by wrapping auth.uid() in (select auth.uid())
    - This prevents re-evaluation of auth.uid() for each row, improving query performance at scale
    - Affected tables:
      - timeline_vendors (3 policies)
      - message_attachments (3 policies)

  2. Drop Unused Indexes
    - Remove 26 unused indexes to reduce storage overhead and improve write performance
    - These indexes were identified by Supabase's unused index detection

  3. Notes
    - Password breach protection must be enabled through Supabase Dashboard
    - Navigate to Authentication > Providers > Email > Password Protection
*/

-- ============================================================================
-- PART 1: Optimize RLS Policies
-- ============================================================================

-- Drop existing policies for timeline_vendors
DROP POLICY IF EXISTS "Event members can add timeline vendors" ON timeline_vendors;
DROP POLICY IF EXISTS "Event members can remove timeline vendors" ON timeline_vendors;
DROP POLICY IF EXISTS "Event members can view timeline vendors" ON timeline_vendors;

-- Recreate timeline_vendors policies with optimized auth.uid() calls
CREATE POLICY "Event members can view timeline vendors"
  ON timeline_vendors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM event_timeline et
      JOIN event_members em ON et.event_id = em.event_id
      WHERE et.id = timeline_vendors.timeline_id
      AND em.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Event members can add timeline vendors"
  ON timeline_vendors FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM event_timeline et
      JOIN event_members em ON et.event_id = em.event_id
      WHERE et.id = timeline_vendors.timeline_id
      AND em.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Event members can remove timeline vendors"
  ON timeline_vendors FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM event_timeline et
      JOIN event_members em ON et.event_id = em.event_id
      WHERE et.id = timeline_vendors.timeline_id
      AND em.user_id = (select auth.uid())
    )
  );

-- Drop existing policies for message_attachments
DROP POLICY IF EXISTS "Users can view attachments in their events" ON message_attachments;
DROP POLICY IF EXISTS "Users can insert attachments for own messages" ON message_attachments;
DROP POLICY IF EXISTS "Users can delete own attachments" ON message_attachments;

-- Recreate message_attachments policies with optimized auth.uid() calls
CREATE POLICY "Users can view attachments in their events"
  ON message_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM event_messages em
      JOIN event_members emem ON em.event_id = emem.event_id
      WHERE em.id = message_attachments.message_id
      AND emem.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert attachments for own messages"
  ON message_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM event_messages
      WHERE event_messages.id = message_attachments.message_id
      AND event_messages.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete own attachments"
  ON message_attachments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM event_messages
      WHERE event_messages.id = message_attachments.message_id
      AND event_messages.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- PART 2: Drop Unused Indexes
-- ============================================================================

DROP INDEX IF EXISTS idx_event_contacts_user_id;
DROP INDEX IF EXISTS idx_event_media_uploaded_by;
DROP INDEX IF EXISTS idx_referrals_referrer_id;
DROP INDEX IF EXISTS idx_profiles_referral_code;
DROP INDEX IF EXISTS idx_push_tokens_user_id;
DROP INDEX IF EXISTS idx_push_tokens_device_id;
DROP INDEX IF EXISTS idx_timeline_notifications_event_id;
DROP INDEX IF EXISTS idx_timeline_notifications_user_id;
DROP INDEX IF EXISTS idx_message_receipts_message_id;
DROP INDEX IF EXISTS idx_message_receipts_user_id;
DROP INDEX IF EXISTS idx_message_notifications_event_id;
DROP INDEX IF EXISTS idx_message_notifications_user_id;
DROP INDEX IF EXISTS idx_vendor_invitations_event_id;
DROP INDEX IF EXISTS idx_event_vendors_status;
DROP INDEX IF EXISTS idx_contacts_contact_user_id;
DROP INDEX IF EXISTS idx_event_members_added_by;
DROP INDEX IF EXISTS idx_event_messages_user_id;
DROP INDEX IF EXISTS idx_event_vendor_invitations_invited_by;
DROP INDEX IF EXISTS idx_event_vendors_invited_by;
DROP INDEX IF EXISTS idx_message_notifications_message_id;
DROP INDEX IF EXISTS idx_profiles_referred_by;
DROP INDEX IF EXISTS idx_referrals_referred_user_id;
DROP INDEX IF EXISTS idx_timeline_notifications_timeline_id;
DROP INDEX IF EXISTS idx_waitlist_email;
DROP INDEX IF EXISTS idx_waitlist_signed_up_at;
DROP INDEX IF EXISTS idx_events_created_by;
DROP INDEX IF EXISTS idx_events_event_date;
DROP INDEX IF EXISTS idx_manual_contacts_email;
