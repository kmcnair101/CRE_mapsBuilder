/*
  # Add subscription status tracking

  1. Changes
    - Add subscription_status column to profiles table
    - Add comment explaining valid status values
    - Update existing profiles to have default status
*/

-- Add subscription_status column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'free';

-- Add comment explaining valid status values
COMMENT ON COLUMN profiles.subscription_status IS 'Subscription status from Stripe. Valid values: free, active, past_due, canceled, incomplete, incomplete_expired, trialing, unpaid';

-- Update existing profiles to have a status based on their tier
UPDATE profiles 
SET subscription_status = CASE 
  WHEN subscription_tier = 'pro' THEN 'active'
  ELSE 'free'
END
WHERE subscription_status IS NULL;