/*
  # Add thumbnail column to maps table

  1. Changes
    - Add `thumbnail` column to store map preview images
    - Column type is `text` to store base64 encoded image data
*/

ALTER TABLE maps
ADD COLUMN IF NOT EXISTS thumbnail text;