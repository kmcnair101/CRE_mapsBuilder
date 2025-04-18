import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/types'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
})

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const { stripe_subscription_id } = req.body

  if (!stripe_subscription_id) {
    return res.status(400).json({ error: 'Missing subscription ID' })
  }

  try {
    // Cancel immediately or at period end
    await stripe.subscriptions.update(stripe_subscription_id, {
      cancel_at_period_end: true,
    })

    return res.status(200).json({ message: 'Subscription cancellation scheduled.' })
  } catch (error: any) {
    console.error('Stripe cancellation error:', error)
    return res.status(500).json({ error: error.message })
  }
}
