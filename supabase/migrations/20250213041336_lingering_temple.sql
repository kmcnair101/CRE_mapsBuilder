-- Add subject_property column
ALTER TABLE maps
ADD COLUMN IF NOT EXISTS subject_property jsonb;

-- Add thumbnail column (for safety)
ALTER TABLE maps
ADD COLUMN IF NOT EXISTS thumbnail text;

-- Add map_style column
ALTER TABLE maps
ADD COLUMN IF NOT EXISTS map_style jsonb;