-- Drop existing function and recreate with better error handling
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Only insert if profile doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = NEW.id
  ) THEN
    INSERT INTO public.profiles (
      id,
      email,
      subscription_tier,
      trial_ends_at
    ) VALUES (
      NEW.id,
      NEW.email,
      'free',
      (CURRENT_TIMESTAMP + INTERVAL '14 days')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Fix team policies to prevent recursion
DROP POLICY IF EXISTS "Enable read access for team members" ON teams;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON teams;
DROP POLICY IF EXISTS "Enable update for team owners" ON teams;
DROP POLICY IF EXISTS "Enable delete for team owners" ON teams;

-- Create new non-recursive policies
CREATE POLICY "Team members can view teams"
  ON teams
  FOR SELECT
  USING (
    id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create teams"
  ON teams
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Team owners can update teams"
  ON teams
  FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Team owners can delete teams"
  ON teams
  FOR DELETE
  USING (owner_id = auth.uid());

-- Add indexes to improve performance
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);