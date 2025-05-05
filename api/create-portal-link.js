import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase/client'

export default function SubscriptionPage() {
  const { user } = useAuthStore()
  const [portalUrl, setPortalUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPortalLink = async () => {
      if (!user) return

      try {
        // Check if user has an active subscription
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'active') // Optional: only fetch active subscriptions
          .single()

        if (subError || !subscription) {
          setLoading(false)
          return
        }

        // Fetch the Stripe customer portal link
        const res = await fetch('/api/create-portal-link', {
          method: 'POST',
          body: JSON.stringify({ userId: user.id }),
        })

        if (!res.ok) {
          const text = await res.text()
          console.error('Error creating portal link:', text)
          setError('Failed to create portal link.')
          return
        }

        const { url } = await res.json()
        if (url) setPortalUrl(url)
      } catch (err) {
        console.error('Unexpected error:', err)
        setError('An unexpected error occurred.')
      } finally {
        setLoading(false)
      }
    }

    fetchPortalLink()
  }, [user])

  if (loading) return <div className="text-gray-600 mt-6">Loading subscription...</div>

  return (
    <div className="mt-8 max-w-md mx-auto">
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {portalUrl ? (
        <a
          href={portalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Manage Subscription
        </a>
      ) : (
        <p className="text-gray-700">
          You are not currently subscribed. Please go back to your map and subscribe.
        </p>
      )}
    </div>
  )
}
