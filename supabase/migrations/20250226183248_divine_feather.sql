/*
  # Add Map Operation Timeouts

  1. Changes
    - Add function to handle map operation timeouts
    - Add trigger for map operations
    - Add indexes for better performance
    - Add comments explaining timeout handling
*/

-- Create function to handle map operations with timeout
CREATE OR REPLACE FUNCTION handle_map_operation()
RETURNS trigger AS $$
DECLARE
  timeout_setting text;
BEGIN
  -- Get current role's timeout setting
  SELECT setting INTO timeout_setting
  FROM pg_settings
  WHERE name = 'statement_timeout';

  -- Set a 30 second timeout for this transaction
  EXECUTE 'SET LOCAL statement_timeout = ''30s''';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for map operations
CREATE TRIGGER before_map_operation
  BEFORE INSERT OR UPDATE OR DELETE ON maps
  FOR EACH STATEMENT
  EXECUTE FUNCTION handle_map_operation();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_maps_updated_at 
ON maps(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_maps_created_at 
ON maps(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_maps_title 
ON maps(title);

-- Add comment explaining timeout handling
COMMENT ON TABLE maps IS 'Maps table with operation timeouts (30s) and performance optimizations';

COMMENT ON FUNCTION handle_map_operation() IS 'Sets a 30 second timeout for map operations to prevent long-running queries';