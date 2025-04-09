/*
  # Add subject property column to maps table

  1. Changes
    - Add `subject_property` column to store subject property data as JSON
    - Add `thumbnail` column if it doesn't exist (for safety)

  2. Notes
    - Using JSONB for better performance and indexing capabilities
    - Column is nullable since maps might not have a subject property initially
*/

-- Add subject_property column
ALTER TABLE maps
ADD COLUMN IF NOT EXISTS subject_property jsonb;

-- Add thumbnail column (for safety)
ALTER TABLE maps
ADD COLUMN IF NOT EXISTS thumbnail text;