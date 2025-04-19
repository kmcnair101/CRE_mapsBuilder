import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-11-15',
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  console.log('🧪 Received request body:', req.body)
  console.log('🔐 STRIPE_SECRET_KEY loaded:', !!process.env.STRIPE_SECRET_KEY)
  console.log('🧾 STRIPE_PRICE_ID_MONTHLY:', process.env.STRIPE_PRICE_ID_MONTHLY)
  console.log('🧾 STRIPE_PRICE_ID_ANNUAL:', process.env.STRIPE_PRICE_ID_ANNUAL)
  console.log('🌐 NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL)

  const { plan, userId } = req.body

  const priceId =
    plan === 'annual'
      ? process.env.STRIPE_PRICE_ID_ANNUAL
      : process.env.STRIPE_PRICE_ID_MONTHLY

  if (!priceId || !userId) {
    return res.status(400).json({ error: 'Missing priceId or userId' })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscription?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscription?canceled=true`,
      metadata: {
        userId,
        priceId,
      },
    })

    return res.status(200).json({ url: session.url })
  } catch (error: any) {
    console.error('❌ Stripe Checkout Error:', error)
    return res.status(500).json({ error: error.message || 'Unknown server error' })
  }
}
