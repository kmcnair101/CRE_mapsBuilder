const Stripe = require('stripe');

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Vercel Serverless Function: Create Stripe Checkout Session
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    console.log('🧪 Incoming request body:', req.body);

    const { userId, plan } = req.body;

    if (!userId || !plan) {
      return res.status(400).json({ error: 'Missing userId or plan' });
    }

    const priceId =
      plan === 'annual'
        ? process.env.STRIPE_PRICE_ID_ANNUAL
        : process.env.STRIPE_PRICE_ID_MONTHLY;

    if (!priceId || !process.env.NEXT_PUBLIC_SITE_URL) {
      return res.status(500).json({ error: 'Stripe price ID or site URL missing' });
    }

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
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('❌ Stripe error:', error);
    return res.status(500).json({ error: error.message });
  }
};
