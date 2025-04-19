import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase/client'
import { useNavigate } from 'react-router-dom'

export function SubscriptionDetails() {
  const { user, profile, loadProfile } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [subscription, setSubscription] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return

    const fetchSubscription = async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error)
        setError('Failed to load subscription.')
      } else {
        setSubscription(data)
      }
    }

    fetchSubscription()
  }, [user])

  const handleSubscribe = async () => {
    setLoading(true)
    setError('')
  
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          plan: 'monthly' // or 'annual' dynamically
        })
      })
  
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('Failed to redirect to checkout.')
      }
    } catch (err: any) {
      console.error('Subscription error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Subscription Details</h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">{error}</div>
      )}

      {loading && <p className="text-gray-600 mb-4">Loading...</p>}

      {!subscription ? (
        <div className="text-center">
          <p className="mb-4 text-gray-700">No active subscription found.</p>
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Redirecting...' : 'Subscribe Now'}
          </button>
        </div>
      ) : (
        <div className="bg-gray-100 p-4 rounded shadow">
          <p><strong>Status:</strong> {subscription.status}</p>
          <p><strong>Plan:</strong> {subscription.stripe_price_id}</p>
          <p><strong>Period Start:</strong> {new Date(subscription.current_period_start).toLocaleDateString()}</p>
          <p><strong>Period End:</strong> {new Date(subscription.current_period_end).toLocaleDateString()}</p>
        </div>
      )}
    </div>
  )
}