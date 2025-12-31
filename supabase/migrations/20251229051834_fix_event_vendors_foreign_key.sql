/*
  # Fix Event Vendors Foreign Key

  1. Changes
    - Drop existing foreign key from event_vendors.user_id to auth.users.id
    - Create new foreign key from event_vendors.user_id to profiles.id
    - This allows proper joins between event_vendors and profiles tables

  2. Security
    - No changes to RLS policies needed
    - Maintains existing security model

  3. Notes
    - This fix resolves the "Could not find a relationship" error when querying event vendors with profile data
    - The profiles table already has a foreign key to auth.users, so this maintains referential integrity
*/

-- Drop existing foreign key
ALTER TABLE event_vendors DROP CONSTRAINT IF EXISTS event_vendors_user_id_fkey;

-- Add new foreign key to profiles
ALTER TABLE event_vendors 
ADD CONSTRAINT event_vendors_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES profiles(id)
ON DELETE CASCADE;