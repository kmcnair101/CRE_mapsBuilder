-- Add canvas_size column if it doesn't exist
ALTER TABLE maps
ADD COLUMN IF NOT EXISTS canvas_size jsonb;

-- Add comment to explain canvas_size structure
COMMENT ON COLUMN maps.canvas_size IS 'Stores canvas size information including:
- id: identifier for preset sizes
- name: display name of the size
- width: canvas width in pixels
- height: canvas height in pixels
- description: human-readable description of the size';