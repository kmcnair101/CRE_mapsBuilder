// pages/api/create-portal-link.ts

import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
})

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).end('Method Not Allowed')

    const { userId } = JSON.parse(req.body)

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' })
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .single()

    if (error || !data?.stripe_subscription_id) {
      console.error('Subscription lookup error:', error)
      return res.status(400).json({ error: 'No active subscription found' })
    }

    const subscription = await stripe.subscriptions.retrieve(data.stripe_subscription_id)

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.customer as string,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscription`,
    })

    return res.status(200).json({ url: portalSession.url })
  } catch (err: any) {
    console.error('Server error:', err)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
