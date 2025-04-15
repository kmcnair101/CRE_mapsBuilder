import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function requireSubscription(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void
) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header required' });
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return res.status(500).json({ error: 'Error fetching profile' });
  }

  if (profile?.subscription_status !== 'active') {
    return res.status(403).json({ 
      error: 'This feature requires an active subscription',
      status: profile?.subscription_status
    });
  }

  next();
} 