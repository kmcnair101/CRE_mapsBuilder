import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase/client'
import { useNavigate } from 'react-router-dom'

export function SubscriptionDetails() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [subscription, setSubscription] = useState<any>(null)
  const [portalUrl, setPortalUrl] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return

    const fetchSubscription = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      if (error) {
        setError('Failed to load subscription.')
        setLoading(false)
        return
      }
      setSubscription(data)

      if (data) {
        const res = await fetch('/api/create-portal-link', {
          method: 'POST',
          body: JSON.stringify({ userId: user.id }),
        })
        const json = await res.json()
        if (json?.url) setPortalUrl(json.url)
      }
      setLoading(false)
    }
    fetchSubscription()
  }, [user])

  const handleSubscribe = async (plan: 'monthly' | 'annual') => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, plan })
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
        <div className="text-center space-y-6">
          <p className="mb-4 text-gray-700">No active subscription found.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Monthly Option */}
            <div className="border rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Monthly Plan</h3>
              <p className="text-gray-600 mb-4">$49 per month</p>
              <button
                onClick={() => handleSubscribe('monthly')}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Redirecting...' : 'Subscribe Monthly'}
              </button>
            </div>

            {/* Annual Option */}
            <div className="border rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Annual Plan</h3>
              <p className="text-gray-600 mb-4">$449 per year</p>
              <button
                onClick={() => handleSubscribe('annual')}
                disabled={loading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Redirecting...' : 'Subscribe Annually'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-100 p-4 rounded shadow text-left">
          <p><strong>Status:</strong> {subscription.status}</p>
          <p><strong>Plan:</strong> {subscription.stripe_price_id}</p>
          <p><strong>Period Start:</strong> {new Date(subscription.current_period_start).toLocaleDateString()}</p>
          <p><strong>Period End:</strong> {new Date(subscription.current_period_end).toLocaleDateString()}</p>
          {portalUrl && (
            <a
              href={portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Manage Subscription
            </a>
          )}
        </div>
      )}
    </div>
  )
}
