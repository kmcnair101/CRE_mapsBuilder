-- Drop existing trigger and function first
DROP TRIGGER IF EXISTS webhook_event_processed ON stripe.webhook_events;
DROP FUNCTION IF EXISTS stripe.handle_webhook_event();

-- Create webhook processing function
CREATE OR REPLACE FUNCTION stripe.handle_webhook_event()
RETURNS trigger AS $$
BEGIN
  -- Update processed_at timestamp
  NEW.processed_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create webhook event trigger
CREATE TRIGGER webhook_event_processed
  BEFORE UPDATE ON stripe.webhook_events
  FOR EACH ROW
  EXECUTE FUNCTION stripe.handle_webhook_event();

-- Grant additional permissions needed for Stripe integration
GRANT INSERT, UPDATE ON stripe.customers TO service_role;
GRANT INSERT, UPDATE ON stripe.subscriptions TO service_role;
GRANT INSERT, UPDATE ON stripe.products TO service_role;
GRANT INSERT, UPDATE ON stripe.prices TO service_role;

-- Add additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_created ON stripe.customers(created);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON stripe.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_products_active ON stripe.products(active);
CREATE INDEX IF NOT EXISTS idx_prices_active ON stripe.prices(active);

-- Add helpful comments
COMMENT ON TABLE stripe.webhook_events IS 'Log of processed Stripe webhook events';
COMMENT ON FUNCTION stripe.handle_webhook_event() IS 'Handles processing of Stripe webhook events';