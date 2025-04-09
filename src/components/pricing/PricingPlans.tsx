import { X } from 'lucide-react'

interface PricingPlanProps {
  isOpen: boolean
  onClose: () => void
}

export function PricingPlans({ isOpen, onClose }: PricingPlanProps) {
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
              <a 
                href="https://billing.zohosecure.com/subscribe/d9adf6900d8364ca1f91f1acbef9b45b7906f5e6327bed22ad482bf477cf719e/CREMaps-Monthly"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Subscribe Monthly
              </a>
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
              <a 
                href="https://billing.zohosecure.com/subscribe/d9adf6900d8364ca1f91f1acbef9b45b7906f5e6327bed22ad482bf477cf719e/CREMaps-Annual"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Subscribe Annually
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 