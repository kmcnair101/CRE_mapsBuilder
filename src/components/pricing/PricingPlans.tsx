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
      // If we're in the map editor, save the current map state
      if (location.pathname.startsWith('/maps/')) {
        const mapId = location.pathname.split('/')[2]
        localStorage.setItem('pendingMapId', mapId)
        localStorage.setItem('pendingMapEdits', JSON.stringify({
          pathname: location.pathname,
          state: location.state
        }))
      }

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user?.id, 
          plan,
          returnUrl: location.pathname // Pass the current path as return URL
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-lg w-full max-w-2xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Choose Your Plan</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
              {error}
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Monthly Plan */}
            <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold mb-4">Monthly Plan</h3>
              <p className="text-3xl font-bold mb-4">$49<span className="text-lg font-normal">/month</span></p>
              <ul className="mb-6 space-y-2">
                <li>✓ Full access to all features</li>
                <li>✓ Monthly billing</li>
                <li>✓ Cancel anytime</li>
              </ul>
              <button 
                onClick={() => handleSubscribe('monthly')}
                disabled={loading}
                className="block w-full text-center bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Please wait...' : 'Subscribe Monthly'}
              </button>
            </div>

            {/* Annual Plan */}
            <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow border-blue-200 bg-blue-50 relative">
              <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 text-sm rounded-bl">
                Best Value
              </div>
              <h3 className="text-xl font-semibold mb-4">Annual Plan</h3>
              <p className="text-3xl font-bold mb-4">$449<span className="text-lg font-normal">/year</span></p>
              <p className="text-sm text-green-600 mb-4">Save $139 annually</p>
              <ul className="mb-6 space-y-2">
                <li>✓ All monthly plan features</li>
                <li>✓ Save 24% annually</li>
                <li>✓ Priority support</li>
              </ul>
              <button 
                onClick={() => handleSubscribe('annual')}
                disabled={loading}
                className="block w-full text-center bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Please wait...' : 'Subscribe Annually'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 