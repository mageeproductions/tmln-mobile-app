/*
  # Add Onboarding Fields to Profiles

  1. New Columns
    - `events_per_year` (text) - How many events the user does annually (for pricing tier recommendations)
    - `referral_source` (text) - How the user heard about TMLN

  2. Purpose
    - Support multi-step onboarding flow
    - Capture user acquisition source for analytics
    - Determine appropriate pricing tier based on usage volume
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'events_per_year'
  ) THEN
    ALTER TABLE profiles ADD COLUMN events_per_year text DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'referral_source'
  ) THEN
    ALTER TABLE profiles ADD COLUMN referral_source text DEFAULT '';
  END IF;
END $$;