import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const subscription = req.body?.payload?.data?.subscription;
  const customerId = subscription?.customer_id;

  if (!customerId) return res.status(400).json({ error: 'Missing customer_id' });

  const { error } = await supabase
    .from('profiles')
    .update({ subscription_status: 'active' })
    .eq('zoho_customer_id', customerId);

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ success: true });
}
