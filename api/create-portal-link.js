import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase/client'

export default function SubscriptionPage() {
  const { user } = useAuthStore()
  const [portalUrl, setPortalUrl] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPortalLink = async () => {
      if (!user) return

      // Check if user has an active subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active') // Optional: filter for active subscriptions
        .single()

      if (!subscription) {
        setLoading(false)
        return
      }

      // If subscribed, get portal link
      const res = await fetch('/api/create-portal-link', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id }),
      })

      const json = await res.json()
      if (json?.url) setPortalUrl(json.url)

      setLoading(false)
    }

    fetchPortalLink()
  }, [user])

  if (loading) return <div>Loading subscription...</div>

  return (
    <div className="mt-8">
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
