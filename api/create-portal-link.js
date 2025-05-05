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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { userId } = JSON.parse(req.body)

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId in request body' })
    }

    // Retrieve the subscription record
    const { data, error } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .single()

    if (error || !data?.stripe_subscription_id) {
      return res.status(400).json({ error: 'No valid subscription found for user' })
    }

    // Retrieve subscription to get the customer ID
    const subscription = await stripe.subscriptions.retrieve(data.stripe_subscription_id)

    // Create a Stripe billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.customer as string,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account/subscription`,
    })

    return res.status(200).json({ url: portalSession.url })
  } catch (err: any) {
    console.error('Error creating Stripe portal session:', err)
    return res.status(500).json({ error: 'Internal server error', detail: err.message })
  }
}
