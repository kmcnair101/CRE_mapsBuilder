import { useState } from 'react'
import { PricingPlans } from './pricing/PricingPlans'

interface UpgradeButtonProps {
  className?: string
}

export function UpgradeButton({ className }: UpgradeButtonProps) {
  const [showPricing, setShowPricing] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowPricing(true)}
        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${className}`}
      >
        Upgrade Plan
      </button>

      <PricingPlans 
        isOpen={showPricing} 
        onClose={() => setShowPricing(false)} 
      />
    </>
  )
} 