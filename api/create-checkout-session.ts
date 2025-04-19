import type { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/lib/supabase/types'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2022-11-15',
})

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
)

type ResponseData = {
  url?: string
  error?: string
}

type RequestBody = {
  plan: 'monthly' | 'annual'
  userId: string
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  try {
    const { plan, userId } = req.body as RequestBody

    // Debug logging
    console.log('🧪 Received request body:', req.body)
    console.log('🔐 STRIPE_SECRET_KEY loaded:', !!process.env.STRIPE_SECRET_KEY)
    console.log('🧾 STRIPE_PRICE_ID_MONTHLY:', process.env.STRIPE_PRICE_ID_MONTHLY)
    console.log('🧾 STRIPE_PRICE_ID_ANNUAL:', process.env.STRIPE_PRICE_ID_ANNUAL)
    console.log('🌐 NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL)

    const priceId =
      plan === 'annual'
        ? process.env.STRIPE_PRICE_ID_ANNUAL
        : process.env.STRIPE_PRICE_ID_MONTHLY

    if (!priceId || !userId) {
      return res.status(400).json({ error: 'Missing priceId or userId' })
    }

    // Get user email from Supabase
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('❌ Supabase profile fetch error:', profileError)
      return res.status(500).json({ error: 'Failed to fetch user profile' })
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/cancel`,
      metadata: {
        userId,
        priceId,
      },
      customer_email: profile?.email,
    })

    return res.status(200).json({ url: session.url })
  } catch (error) {
    console.error('❌ Stripe Checkout Error:', error)
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    })
  }
}
