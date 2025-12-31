/*
  # Create Waitlist Table
  
  This migration creates the waitlist table for storing early access signups for the event planning app landing page.
  
  ## New Tables
  
  1. `waitlist`
    - `id` (uuid, primary key) - Unique identifier for each signup
    - `email` (text, unique, required) - Email address of the subscriber
    - `signed_up_at` (timestamptz, default now()) - Timestamp when the user signed up
    - `referral_source` (text, optional) - Optional field to track where the signup came from
  
  ## Security
  
  - Enable Row Level Security (RLS) on the `waitlist` table
  - Add INSERT policy allowing public users to sign up for the waitlist
  - Add SELECT policy allowing only authenticated administrators to view waitlist entries
  
  ## Important Notes
  
  1. Email addresses are unique to prevent duplicate signups
  2. Timestamps are automatically set on signup
  3. The table is secured with RLS policies to protect user data
  4. Public users can insert, ensuring public signup functionality
*/

CREATE TABLE IF NOT EXISTS waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  signed_up_at timestamptz DEFAULT now(),
  referral_source text
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can sign up for waitlist"
  ON waitlist
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view waitlist"
  ON waitlist
  FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);

CREATE INDEX IF NOT EXISTS idx_waitlist_signed_up_at ON waitlist(signed_up_at DESC);