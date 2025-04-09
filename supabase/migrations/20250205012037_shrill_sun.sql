/*
  # Initial Schema Setup for Retailer Map

  1. New Tables
    - profiles
      - id (uuid, references auth.users)
      - email (text)
      - full_name (text)
      - subscription_tier (text)
      - created_at (timestamp)
      - updated_at (timestamp)
    
    - maps
      - id (uuid)
      - user_id (uuid, references profiles)
      - title (text)
      - description (text)
      - center_lat (float8)
      - center_lng (float8)
      - zoom_level (int)
      - overlays (jsonb)
      - is_public (boolean)
      - created_at (timestamp)
      - updated_at (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  subscription_tier text DEFAULT 'free',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create maps table
CREATE TABLE maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  center_lat float8 NOT NULL,
  center_lng float8 NOT NULL,
  zoom_level int NOT NULL DEFAULT 14,
  overlays jsonb DEFAULT '[]'::jsonb,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maps ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Maps policies
CREATE POLICY "Users can view own maps"
  ON maps FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR 
    is_public = true
  );

CREATE POLICY "Users can insert own maps"
  ON maps FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own maps"
  ON maps FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own maps"
  ON maps FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());