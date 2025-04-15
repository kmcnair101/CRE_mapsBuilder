-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can only create maps with active subscription" ON maps;
DROP POLICY IF EXISTS "Free users can only create up to 3 maps" ON maps;
DROP POLICY IF EXISTS "Users can only update maps with active subscription" ON maps;
DROP POLICY IF EXISTS "Users can only delete maps with active subscription" ON maps;

-- Enable RLS on maps table if not already enabled
ALTER TABLE maps ENABLE ROW LEVEL SECURITY;

-- Create subscription-based policies for maps
CREATE POLICY "Users can only create maps with active subscription"
ON maps
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND subscription_status = 'active'
  )
);

CREATE POLICY "Free users can only create up to 3 maps"
ON maps
FOR INSERT
TO authenticated
WITH CHECK (
  (
    SELECT COUNT(*) 
    FROM maps 
    WHERE user_id = auth.uid()
  ) < 3
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND subscription_status = 'active'
  )
);

CREATE POLICY "Users can only update maps with active subscription"
ON maps
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND subscription_status = 'active'
  )
);

CREATE POLICY "Users can only delete maps with active subscription"
ON maps
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND subscription_status = 'active'
  )
);

-- Add comments for documentation
COMMENT ON POLICY "Users can only create maps with active subscription" ON maps IS 'Restricts map creation to users with active subscriptions';
COMMENT ON POLICY "Free users can only create up to 3 maps" ON maps IS 'Limits free users to 3 maps, while allowing unlimited maps for active subscribers';
COMMENT ON POLICY "Users can only update maps with active subscription" ON maps IS 'Restricts map updates to users with active subscriptions';
COMMENT ON POLICY "Users can only delete maps with active subscription" ON maps IS 'Restricts map deletion to users with active subscriptions'; 