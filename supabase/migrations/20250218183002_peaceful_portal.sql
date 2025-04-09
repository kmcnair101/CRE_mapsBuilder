/*
  # Enhanced User Profiles and Teams

  1. Profile Enhancements
    - Add contact fields (first_name, last_name, phone)
    - Add business fields (company, website)
    - Add subscription tracking fields

  2. New Tables
    - teams: Team management
    - team_members: Team membership and roles

  3. Security
    - RLS policies for teams and members
    - Subscription status tracking
*/

-- Enhance profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS company text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subscription_status text DEFAULT 'inactive',
  subscription_id text,
  stripe_customer_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Team owners can manage their teams" ON teams;
DROP POLICY IF EXISTS "Team members can view their teams" ON teams;
DROP POLICY IF EXISTS "Team owners can manage team members" ON team_members;
DROP POLICY IF EXISTS "Users can view their team memberships" ON team_members;

-- Recreate team policies
CREATE POLICY "Team owners can manage their teams"
  ON teams
  USING (owner_id = auth.uid());

CREATE POLICY "Team members can view their teams"
  ON teams
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
    )
  );

-- Recreate team members policies
CREATE POLICY "Team owners can manage team members"
  ON team_members
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their team memberships"
  ON team_members
  FOR SELECT
  USING (user_id = auth.uid());

-- Create function to handle subscription status updates
CREATE OR REPLACE FUNCTION handle_subscription_update()
RETURNS trigger AS $$
  BEGIN
    NEW.updated_at = now();
    RETURN NEW;
  END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_subscription_update ON teams;

-- Recreate trigger for subscription updates
CREATE TRIGGER on_subscription_update
  BEFORE UPDATE OF subscription_status, subscription_id
  ON teams
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_update();

-- Add team_id to maps table if it doesn't exist
ALTER TABLE maps
ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE SET NULL;