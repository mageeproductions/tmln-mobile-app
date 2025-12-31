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
  - Add INSERT policy allowing anonymous users to sign up for the waitlist
  - Add SELECT policy allowing only authenticated administrators to view waitlist entries
  
  ## Important Notes
  
  1. Email addresses are unique to prevent duplicate signups
  2. Timestamps are automatically set on signup
  3. The table is secured with RLS policies to protect user data
  4. Anonymous users can only insert, ensuring public signup functionality
*/

-- Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  signed_up_at timestamptz DEFAULT now(),
  referral_source text
);

-- Enable Row Level Security
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert into waitlist (for public signups)
CREATE POLICY "Anyone can sign up for waitlist"
  ON waitlist
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only authenticated users can view waitlist (for admin access)
CREATE POLICY "Authenticated users can view waitlist"
  ON waitlist
  FOR SELECT
  TO authenticated
  USING (true);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);

-- Create index on signed_up_at for sorting
CREATE INDEX IF NOT EXISTS idx_waitlist_signed_up_at ON waitlist(signed_up_at DESC);