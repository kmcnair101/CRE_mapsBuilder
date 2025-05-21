import { useState } from 'react'
import { X } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'
import { useLocation } from 'react-router-dom'

interface PricingPlanProps {
  isOpen: boolean
  onClose: () => void
  onSave?: () => Promise<void>
}

export function PricingPlans({ isOpen, onClose, onSave }: PricingPlanProps) {
  console.log('[PricingPlans] Received onSave prop:', typeof onSave, onSave)
  
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const location = useLocation()

  const handleSubscribe = async (plan: 'monthly' | 'annual') => {
    setLoading(true)
    setError('')

    try {
      console.log('[PricingPlans] handleSubscribe called for plan:', plan)
      console.log('[PricingPlans] onSave in handleSubscribe:', typeof onSave, onSave)

      if (onSave) {
        console.log('[PricingPlans] Calling onSave before Stripe redirect')
        await onSave()
        console.log('[PricingPlans] onSave completed')
      } else {
        console.log('[PricingPlans] No onSave prop provided')
      }

      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          plan,
          returnUrl: '/'
        })
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('Failed to redirect to checkout.')
      }
    } catch (err) {
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
            <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">
              {error}
            </div>
          )}

          <div className="text-center space-y-6">
            <p className="mb-4 text-gray-700">
              Choose a plan to unlock map downloads
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Monthly Plan */}
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

              {/* Annual Plan */}
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
