/*
  # Remove Payment System

  1. Tables to Drop
    - `event_payments` table (if exists)

  2. Columns to Remove from events table
    - `requires_payment`
    - `ticket_price`
    - `currency`

  3. Security
    - Drop all payment-related policies
    - Drop payment-related indexes
*/

-- Drop policies first
DROP POLICY IF EXISTS "Users can view own payments" ON event_payments;
DROP POLICY IF EXISTS "Event hosts can view event payments" ON event_payments;
DROP POLICY IF EXISTS "System can insert payments" ON event_payments;
DROP POLICY IF EXISTS "System can update payments" ON event_payments;

-- Drop indexes
DROP INDEX IF EXISTS idx_event_payments_user_id;
DROP INDEX IF EXISTS idx_event_payments_event_id;
DROP INDEX IF EXISTS idx_event_payments_stripe_session;
DROP INDEX IF EXISTS idx_event_payments_status;

-- Drop table
DROP TABLE IF EXISTS event_payments;

-- Remove columns from events table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'requires_payment'
  ) THEN
    ALTER TABLE events DROP COLUMN requires_payment;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'ticket_price'
  ) THEN
    ALTER TABLE events DROP COLUMN ticket_price;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'currency'
  ) THEN
    ALTER TABLE events DROP COLUMN currency;
  END IF;
END $$;