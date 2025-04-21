import { buffer } from 'micro'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
})

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

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
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  const data = event.data.object

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = data
      const userId = session.metadata?.userId
      const subscriptionId = session.subscription
      const priceId = session.metadata?.priceId

      if (!userId || !subscriptionId || !priceId) break

      try {
        // Attach userId to the Stripe customer (for future reference)
        if (session.customer) {
          await stripe.customers.update(session.customer, {
            metadata: { userId },
          })
        }

        const stripeSub = await stripe.subscriptions.retrieve(subscriptionId)

        await supabase
          .from('profiles')
          .update({ subscription_status: 'active' })
          .eq('id', userId)

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: priceId,
          status: stripeSub.status,
          current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        await supabase.from('payment_records').insert({
          user_id: userId,
          subscription_id: subscriptionId,
          stripe_payment_id: session.payment_intent,
          amount: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency || 'usd',
          status: session.payment_status || 'paid',
          payment_method: session.payment_method_types?.[0] || 'card',
          created_at: new Date().toISOString(),
        })
      } catch (err) {
        console.error('❌ Error processing checkout.session.completed:', err)
      }

      break
    }

    case 'customer.subscription.deleted': {
      const subscription = data
      let userId = null

      try {
        if (subscription.customer) {
          const customer = await stripe.customers.retrieve(subscription.customer)
          userId = customer.metadata?.userId
        }

        if (!userId) break

        await supabase
          .from('profiles')
          .update({ subscription_status: 'cancelled' })
          .eq('id', userId)

        await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)
      } catch (err) {
        console.error('❌ Error processing customer.subscription.deleted:', err)
      }

      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  res.status(200).json({ received: true })
}
