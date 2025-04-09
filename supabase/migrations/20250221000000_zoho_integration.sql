-- Update subscription status values for Zoho
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS subscription_status_check;

ALTER TABLE profiles
ADD CONSTRAINT subscription_status_check
CHECK (subscription_status IN ('free', 'active', 'expired', 'cancelled', 'non_renewing'));

-- Update comment
COMMENT ON COLUMN profiles.subscription_status IS 'Subscription status from Zoho. Valid values: free, active, expired, cancelled, non_renewing';

-- Remove Stripe-specific columns
ALTER TABLE profiles
DROP COLUMN IF EXISTS stripe_customer_id;

-- Drop Stripe schema and all its objects
DROP SCHEMA IF EXISTS stripe CASCADE; 