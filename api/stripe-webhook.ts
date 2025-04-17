import { buffer } from 'micro'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
})

// Use your Supabase Service Role key for full access
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Required to handle raw body
export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed')
  }

  const sig = req.headers['stripe-signature']

  let event

  try {
    const buf = await buffer(req)
    event = stripe.webhooks.constructEvent(buf, sig!, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  const data = event.data.object

  switch (event.type) {
    case 'checkout.session.completed': {
      const userId = data.metadata?.userId
      if (!userId) break

      await supabase
        .from('profiles')
        .update({ subscription_status: 'active' })
        .eq('id', userId)

      break
    }

    case 'customer.subscription.deleted': {
      const subscription = data
      const userId = subscription.metadata?.userId
      if (!userId) break

      await supabase
        .from('profiles')
        .update({ subscription_status: 'cancelled' })
        .eq('id', userId)

      break
    }

    // Add more cases as needed
    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  res.status(200).json({ received: true })
}