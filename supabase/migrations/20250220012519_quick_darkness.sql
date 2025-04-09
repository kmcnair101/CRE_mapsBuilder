-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view their own customer data" ON stripe.customers;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON stripe.subscriptions;
DROP POLICY IF EXISTS "Anyone can view active products" ON stripe.products;
DROP POLICY IF EXISTS "Anyone can view active prices" ON stripe.prices;

-- Create webhook events table if it doesn't exist
CREATE TABLE IF NOT EXISTS stripe.webhook_events (
  id text PRIMARY KEY,
  type text NOT NULL,
  data jsonb NOT NULL,
  created timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone,
  error text
);

-- Enable RLS on webhook events
ALTER TABLE stripe.webhook_events ENABLE ROW LEVEL SECURITY;

-- Grant webhook event permissions
GRANT INSERT, UPDATE ON stripe.webhook_events TO service_role;

-- Create webhook event policies
CREATE POLICY "Service role can manage webhook events"
  ON stripe.webhook_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add webhook event indexes
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON stripe.webhook_events(type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON stripe.webhook_events(created);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON stripe.webhook_events(processed_at);

-- Add helpful comments
COMMENT ON TABLE stripe.webhook_events IS 'Log of processed Stripe webhook events';
COMMENT ON COLUMN stripe.webhook_events.type IS 'Type of Stripe webhook event';
COMMENT ON COLUMN stripe.webhook_events.data IS 'Raw webhook event data from Stripe';
COMMENT ON COLUMN stripe.webhook_events.processed_at IS 'When the webhook was processed';
COMMENT ON COLUMN stripe.webhook_events.error IS 'Error message if processing failed';

-- Recreate customer policies
CREATE POLICY "Users can view their own customer data"
  ON stripe.customers
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT stripe_customer_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Recreate subscription policies
CREATE POLICY "Users can view their own subscriptions"
  ON stripe.subscriptions
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT stripe_customer_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- Recreate product policies
CREATE POLICY "Anyone can view active products"
  ON stripe.products
  FOR SELECT
  TO authenticated
  USING (active = true);

-- Recreate price policies
CREATE POLICY "Anyone can view active prices"
  ON stripe.prices
  FOR SELECT
  TO authenticated
  USING (active = true);