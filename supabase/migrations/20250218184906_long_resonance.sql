-- Drop existing team policies
DROP POLICY IF EXISTS "Team owners can manage their teams" ON teams;
DROP POLICY IF EXISTS "Team members can view their teams" ON teams;

-- Create new team policies with proper access control
CREATE POLICY "Enable read access for team members"
  ON teams
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Enable insert for authenticated users"
  ON teams
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Enable update for team owners"
  ON teams
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Enable delete for team owners"
  ON teams
  FOR DELETE
  USING (owner_id = auth.uid());

-- Add comment explaining policies
COMMENT ON TABLE teams IS 'Teams table with the following policies:
- SELECT: Team members can view their teams
- INSERT: Authenticated users can create teams (as owner)
- UPDATE: Only team owner can update team details
- DELETE: Only team owner can delete team';