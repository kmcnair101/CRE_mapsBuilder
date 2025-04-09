/*
  # Add Map Performance Indexes

  1. New Indexes
    - Maps table:
      - user_id + updated_at
      - user_id + created_at
      - user_id + title
      - is_public
  
  2. Changes
    - Add indexes to improve map listing and filtering performance
*/

-- Add composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_maps_user_updated 
ON maps(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_maps_user_created 
ON maps(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_maps_user_title 
ON maps(user_id, title);

-- Add index for public maps
CREATE INDEX IF NOT EXISTS idx_maps_is_public 
ON maps(is_public) 
WHERE is_public = true;

-- Add comment explaining indexes
COMMENT ON TABLE maps IS 'Maps table with the following indexes:
- user_id + updated_at: For sorting user maps by last update
- user_id + created_at: For sorting user maps by creation date
- user_id + title: For sorting user maps alphabetically
- is_public: For filtering public maps';