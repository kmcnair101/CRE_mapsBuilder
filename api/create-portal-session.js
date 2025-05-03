import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
})

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { customerId } = req.body

  if (!customerId) {
    return res.status(400).json({ error: 'Missing customerId' })
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: 'https://yourdomain.com/subscription', // Change to your actual return URL
    })

    return res.status(200).json({ url: session.url })
  } catch (error) {
    console.error('Error creating portal session:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
