/*
  # Map Styling Schema Update

  1. Changes
    - Add map_style column to store map styling preferences
    - Add container_style column to overlays JSON schema
    - Add style column to subject_property JSON schema

  2. Notes
    - Using JSONB for flexible styling options
    - Maintains backward compatibility
    - No data loss - existing records remain unchanged
*/

-- Ensure map_style column exists
ALTER TABLE maps
ADD COLUMN IF NOT EXISTS map_style jsonb;

-- Add comment to explain map_style structure
COMMENT ON COLUMN maps.map_style IS 'Stores map styling preferences including:
- type: base map style (default, satellite, terrain)
- customStyles: array of Google Maps style objects
- hideLabels: boolean to control label visibility
- hideStreetNames: boolean to control street name visibility
- hidePOIs: boolean to control POI visibility
- highlightHighways: object with color and opacity for highway styling';

-- Add comment to explain overlays structure
COMMENT ON COLUMN maps.overlays IS 'Array of overlay objects with properties:
- id: unique identifier
- type: overlay type (image, text, business)
- position: lat/lng coordinates
- properties: overlay-specific properties including:
  - containerStyle: styling for overlay container
  - content: text content or image URL
  - businessName: name for business overlays
  - logo: business logo URL';

-- Add comment to explain subject_property structure
COMMENT ON COLUMN maps.subject_property IS 'Object containing subject property details:
- address: property address
- lat/lng: coordinates
- name: display name
- image: property image URL
- style: container styling properties';