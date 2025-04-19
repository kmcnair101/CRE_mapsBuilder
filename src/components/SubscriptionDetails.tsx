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
        .single()

      if (error) {
        console.error('Error fetching subscription:', error)
        setError('Failed to load subscription.')
      } else {
        setSubscription(data)
      }
    }

    fetchSubscription()
  }, [user])

  const handleManageSubscription = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/create-portal-link', {
        method: 'POST',
        body: JSON.stringify({ userId: user?.id }),
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const { url } = await res.json()
      window.location.href = url
    } catch (err) {
      console.error(err)
      setError('Unable to redirect to billing portal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Subscription Details</h2>

      {error && <p className="text-red-500">{error}</p>}

      {!subscription ? (
        <p>No active subscription found.</p>
      ) : (
        <div className="space-y-2 text-sm text-gray-700">
          <p><strong>Status:</strong> {subscription.status}</p>
          <p><strong>Plan:</strong> {subscription.stripe_price_id}</p>
          <p><strong>Current Period Ends:</strong> {new Date(subscription.current_period_end).toLocaleDateString()}</p>

          <button
            onClick={handleManageSubscription}
            className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Manage Billing'}
          </button>
        </div>
      )}
    </div>
  )
}
