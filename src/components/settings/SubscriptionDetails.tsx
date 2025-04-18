import { useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { CreditCard, Calendar, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PricingPlans } from '../pricing/PricingPlans'

export function SubscriptionDetails() {
  const { profile } = useAuthStore()
  const [showPricingPlans, setShowPricingPlans] = useState(false)

  // Helper function to format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Helper function to get status badge style
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'trialing':
        return 'bg-blue-100 text-blue-800'
      case 'past_due':
        return 'bg-yellow-100 text-yellow-800'
      case 'canceled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Helper function to get status display text
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'trialing':
        return 'Trial'
      case 'past_due':
        return 'Past Due'
      case 'canceled':
        return 'Cancelled'
      case 'incomplete':
        return 'Incomplete'
      case 'incomplete_expired':
        return 'Expired'
      case 'unpaid':
        return 'Unpaid'
      case 'free':
        return 'Free'
      default:
        return status
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your subscription and billing
          </p>
        </div>

        {/* Current Plan */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Current Plan</h2>
          <div className="bg-gray-50 rounded-lg p-4 border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 text-gray-400 mr-2" />
                <span className="font-medium text-gray-900">
                  {profile?.subscription_status === 'free' ? 'Free Plan' : 'Premium Plan'}
                </span>
              </div>
              <span className={cn(
                'px-2.5 py-0.5 rounded-full text-xs font-medium',
                getStatusStyle(profile?.subscription_status || 'free')
              )}>
                {getStatusDisplay(profile?.subscription_status || 'free')}
              </span>
            </div>

            {profile?.current_period_end && (
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-2" />
                Current period ends on {formatDate(profile.current_period_end)}
              </div>
            )}

            {profile?.subscription_status === 'past_due' && (
              <div className="mt-4 flex items-start bg-yellow-50 p-4 rounded-md">
                <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
                <div className="text-sm text-yellow-700">
                  Your payment is past due. Please update your payment method to continue using premium features.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          {profile?.subscription_status === 'free' ? (
            <button
              onClick={() => setShowPricingPlans(true)}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Upgrade to Premium
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowPricingPlans(true)}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Change Plan
              </button>
              {profile?.subscription_status !== 'canceled' && (
                <button
                  onClick={() => {/* Handle cancel subscription */}}
                  className="w-full px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Cancel Subscription
                </button>
              )}
            </>
          )}
        </div>

        {/* Pricing Plans Modal */}
        <PricingPlans
          isOpen={showPricingPlans}
          onClose={() => setShowPricingPlans(false)}
        />
      </div>
    </div>
  )
} 