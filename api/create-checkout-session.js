// File: /api/create-checkout-session.js
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET');
console.log('STRIPE_PRICE_ID_MONTHLY:', process.env.STRIPE_PRICE_ID_MONTHLY);
console.log('STRIPE_PRICE_ID_ANNUAL:', process.env.STRIPE_PRICE_ID_ANNUAL);
console.log('NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { userId, plan, returnUrl } = req.body;

    if (!userId || !plan) {
      return res.status(400).json({ error: 'Missing userId or plan' });
    }

    const priceId = plan === 'annual'
      ? process.env.STRIPE_PRICE_ID_ANNUAL
      : process.env.STRIPE_PRICE_ID_MONTHLY;

    if (!priceId || !process.env.NEXT_PUBLIC_SITE_URL) {
      return res.status(500).json({ error: 'Stripe price ID or site URL missing' });
    }
 
    // Use the provided returnUrl or default to home page
    const finalReturnUrl = returnUrl || '/';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}${finalReturnUrl}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}${finalReturnUrl}`,
      metadata: {
        userId,
        priceId,
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('❌ Stripe error:', error);
    return res.status(500).json({ error: error.message });
  }
}