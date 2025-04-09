/*
  # Fix Profile Schema and Storage

  1. Add Missing Columns
    - first_name
    - last_name
    - phone
    - company
    - website
    - avatar_url
    - company_logo_url
    - profile_completed

  2. Add Comments
    - Document column purposes
*/

-- Add missing columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS company text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS company_logo_url text,
ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false;

-- Add comments
COMMENT ON COLUMN profiles.first_name IS 'User''s first name';
COMMENT ON COLUMN profiles.last_name IS 'User''s last name';
COMMENT ON COLUMN profiles.phone IS 'User''s phone number';
COMMENT ON COLUMN profiles.company IS 'User''s company name';
COMMENT ON COLUMN profiles.website IS 'User''s company website';
COMMENT ON COLUMN profiles.avatar_url IS 'URL to user''s profile picture in storage';
COMMENT ON COLUMN profiles.company_logo_url IS 'URL to user''s company logo in storage';
COMMENT ON COLUMN profiles.profile_completed IS 'Whether the user has completed their profile setup';

-- Update profile policies to allow updating new fields
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_company ON profiles(company);