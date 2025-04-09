-- Create schema for Stripe integration
CREATE SCHEMA IF NOT EXISTS stripe;

-- Create customers table
CREATE TABLE IF NOT EXISTS stripe.customers (
  id text PRIMARY KEY,
  email text,
  name text,
  description text,
  created timestamp with time zone,
  metadata jsonb
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS stripe.subscriptions (
  id text PRIMARY KEY,
  customer_id text REFERENCES stripe.customers(id),
  status text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created timestamp with time zone,
  canceled_at timestamp with time zone,
  cancel_at timestamp with time zone,
  ended_at timestamp with time zone,
  metadata jsonb
);

-- Create products table
CREATE TABLE IF NOT EXISTS stripe.products (
  id text PRIMARY KEY,
  name text,
  description text,
  active boolean,
  created timestamp with time zone,
  metadata jsonb
);

-- Create prices table
CREATE TABLE IF NOT EXISTS stripe.prices (
  id text PRIMARY KEY,
  product_id text REFERENCES stripe.products(id),
  currency text,
  unit_amount bigint,
  type text,
  recurring_interval text,
  recurring_interval_count integer,
  active boolean,
  created timestamp with time zone,
  metadata jsonb
);

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA stripe TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA stripe TO authenticated;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own customer data" ON stripe.customers;
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON stripe.subscriptions;
DROP POLICY IF EXISTS "Anyone can view active products" ON stripe.products;
DROP POLICY IF EXISTS "Anyone can view active prices" ON stripe.prices;

-- Create RLS policies
ALTER TABLE stripe.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.prices ENABLE ROW LEVEL SECURITY;

-- Customers policies
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

-- Subscriptions policies
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

-- Products policies
CREATE POLICY "Anyone can view active products"
  ON stripe.products
  FOR SELECT
  TO authenticated
  USING (active = true);

-- Prices policies
CREATE POLICY "Anyone can view active prices"
  ON stripe.prices
  FOR SELECT
  TO authenticated
  USING (active = true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON stripe.customers(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer ON stripe.subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_prices_product ON stripe.prices(product_id);

-- Add comments
COMMENT ON SCHEMA stripe IS 'Schema for Stripe integration tables';
COMMENT ON TABLE stripe.customers IS 'Stripe customers with RLS to limit access to own data';
COMMENT ON TABLE stripe.subscriptions IS 'Stripe subscriptions with RLS to limit access to own data';
COMMENT ON TABLE stripe.products IS 'Stripe products visible to all authenticated users';
COMMENT ON TABLE stripe.prices IS 'Stripe prices visible to all authenticated users';