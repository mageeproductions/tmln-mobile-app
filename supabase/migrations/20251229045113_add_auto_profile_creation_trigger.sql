/*
  # Add Automatic Profile Creation on User Signup

  1. Purpose
    - Automatically create a profile entry when a user signs up
    - This ensures every auth.users entry has a corresponding profiles entry
    - Fixes issue where users can authenticate but can't add events due to missing profile

  2. Changes
    - Create trigger function `handle_new_user()` that creates a profile with user's email
    - Add trigger on auth.users INSERT to call the function
    - Backfill missing profile for existing user (hello@tmlnapp.com)

  3. Security
    - Profile is created with default values
    - RLS policies remain unchanged and secure
*/

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill missing profile for existing user
INSERT INTO public.profiles (id, email, first_name, last_name)
SELECT id, email, '', ''
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
