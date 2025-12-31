/*
  # Fix Waitlist RLS Policy
  
  Update the INSERT policy to allow public access (both anonymous and authenticated users)
  instead of just anonymous users.
  
  ## Changes
  
  1. Drop the existing INSERT policy
  2. Create a new INSERT policy that allows public access
  
  ## Security
  
  - Allows anyone (authenticated or not) to sign up for the waitlist
  - Maintains the SELECT policy for authenticated users only
*/

-- Drop the existing policy
DROP POLICY IF EXISTS "Anyone can sign up for waitlist" ON waitlist;

-- Create new policy allowing public (both anon and authenticated) to insert
CREATE POLICY "Anyone can sign up for waitlist"
  ON waitlist
  FOR INSERT
  TO public
  WITH CHECK (true);
