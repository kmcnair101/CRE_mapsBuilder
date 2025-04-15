import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // Store the webhook event
  const { data: webhookEvent, error: webhookError } = await supabase
    .from('webhook_events')
    .insert({
      event_type: 'payment.success',
      event_data: req.body,
      processed: false,
      event_hash: req.body?.payload?.data?.payment?.payment_id // Optional: Add unique identifier
    })
    .select()
    .single();

  if (webhookError) return res.status(500).json({ error: webhookError.message });

  const payment = req.body?.payload?.data?.payment;
  if (!payment) return res.status(400).json({ error: 'Invalid payment data' });

  // Get profile by Zoho customer ID through auth.users join
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('zoho_customer_id', payment.customer_id)
    .single();

  if (profileError) return res.status(404).json({ error: 'User not found' });

  // Get subscription by zoho_subscription_id
  const { data: subscription, error: subFetchError } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', profile.id)
    .eq('zoho_subscription_id', payment.subscription_id)
    .single();

  if (subFetchError) return res.status(404).json({ error: 'Subscription not found' });

  // Update subscription status
  const { error: subscriptionError } = await supabase
    .from('subscriptions')
    .update({ 
      status: 'active',
      current_period_start: payment.period_start || new Date().toISOString(),
      current_period_end: payment.period_end,
      updated_at: new Date().toISOString()
    })
    .eq('id', subscription.id);

  if (subscriptionError) return res.status(500).json({ error: subscriptionError.message });

  // Create payment record
  const { error: paymentError } = await supabase
    .from('payment_records')
    .insert({
      user_id: profile.id,
      subscription_id: subscription.id, // Using the UUID from our database
      zoho_payment_id: payment.payment_id,
      amount: payment.amount,
      currency: payment.currency,
      status: 'success',
      payment_method: payment.payment_method
    });

  if (paymentError) return res.status(500).json({ error: paymentError.message });

  // Mark webhook as processed with timestamp
  await supabase
    .from('webhook_events')
    .update({ 
      processed: true,
      processed_at: new Date().toISOString()
    })
    .eq('id', webhookEvent.id);

  return res.status(200).json({ success: true });
}
