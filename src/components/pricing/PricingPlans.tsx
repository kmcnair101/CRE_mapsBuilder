import { useState } from 'react'
import { X } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useLocation } from 'react-router-dom'

interface PricingPlanProps {
  isOpen: boolean
  onClose: () => void
}

export function PricingPlans({ isOpen, onClose }: PricingPlanProps) {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const location = useLocation()

  const handleSubscribe = async (plan: 'monthly' | 'annual') => {
    setLoading(true)
    setError('')

    try {
      // Determine if we're in the map editor
      const isInMapEditor = location.pathname.startsWith('/maps/')
      
      // If in map editor, save the current state
      if (isInMapEditor) {
        // Get the map ID from the URL
        const mapId = location.pathname.split('/').pop()
        if (mapId) {
          // Save the current state to localStorage
          const mapState = {
            pendingMapId: mapId,
            pendingMapEdits: localStorage.getItem('pendingMapEdits')
          }
          localStorage.setItem('pendingMapState', JSON.stringify(mapState))
        }
      }

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user?.id, 
          plan,
          returnUrl: isInMapEditor ? window.location.href : '/'
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

  // ... rest of the component ...
}