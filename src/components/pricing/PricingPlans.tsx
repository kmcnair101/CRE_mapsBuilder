import { useState } from 'react'
import { X } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'

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
          // Get the current map data from localStorage
          const pendingMapEdits = localStorage.getItem('pendingMapEdits')
          if (pendingMapEdits) {
            try {
              // Save the map to the database
              const { error: saveError } = await supabase
                .from('maps')
                .update(JSON.parse(pendingMapEdits))
                .eq('id', mapId)

              if (saveError) {
                console.error('Error saving map before subscription:', saveError)
              }

              // Clear the pending edits from localStorage
              localStorage.removeItem('pendingMapEdits')
            } catch (err) {
              console.error('Error processing map data:', err)
            }
          }
        }
      }

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user?.id, 
          plan,
          returnUrl: '/' // Always redirect to home page
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900">
            Upgrade Your Plan
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {error && (
            <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">{error}</div>
          )}

          <div className="text-center space-y-6">
            <p className="mb-4 text-gray-700">Choose a plan to unlock map downloads</p>

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
        </div>
      </div>
    </div>
  )
}