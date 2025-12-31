/*
  # Add excited features to profiles

  1. Changes
    - Add `excited_features` column to `profiles` table
      - Array of text to store selected features user is excited about
      - Defaults to empty array
      - Optional field
  
  2. Notes
    - This field will store features like: "Live, Dynamic Timeline", "All Vendor Social Media Handles", etc.
    - Used during onboarding to understand what features users value most
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'excited_features'
  ) THEN
    ALTER TABLE profiles ADD COLUMN excited_features text[] DEFAULT '{}';
  END IF;
END $$;