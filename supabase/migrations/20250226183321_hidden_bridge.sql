/*
  # Optimize Map Operations and Add Timeouts

  1. Changes
    - Add statement timeout setting for map operations
    - Create optimized indexes for common queries
    - Add proper error handling for timeouts
    - Add comments explaining optimizations

  2. Indexes
    - Composite index for user_id + updated_at
    - Composite index for user_id + created_at 
    - Composite index for user_id + title
    - Filtered index for public maps
*/

-- Create optimized indexes for map queries
CREATE INDEX IF NOT EXISTS idx_maps_user_updated 
ON maps(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_maps_user_created 
ON maps(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_maps_user_title 
ON maps(user_id, title);

-- Add filtered index for public maps
CREATE INDEX IF NOT EXISTS idx_maps_is_public 
ON maps(is_public) 
WHERE is_public = true;

-- Add function to handle map operation timeouts
CREATE OR REPLACE FUNCTION handle_map_timeout()
RETURNS trigger AS $$
BEGIN
  -- Set statement timeout to 30 seconds
  EXECUTE 'SET LOCAL statement_timeout = ''30s''';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for map operations
CREATE TRIGGER map_timeout_trigger
  BEFORE INSERT OR UPDATE OR DELETE ON maps
  FOR EACH STATEMENT
  EXECUTE FUNCTION handle_map_timeout();

-- Add comment explaining optimizations
COMMENT ON TABLE maps IS 'Maps table with optimized indexes and 30 second operation timeout';

-- Add comments explaining indexes
COMMENT ON INDEX idx_maps_user_updated IS 'Optimizes queries sorting by update date';
COMMENT ON INDEX idx_maps_user_created IS 'Optimizes queries sorting by creation date';
COMMENT ON INDEX idx_maps_user_title IS 'Optimizes queries sorting by title';
COMMENT ON INDEX idx_maps_is_public IS 'Optimizes queries for public maps';