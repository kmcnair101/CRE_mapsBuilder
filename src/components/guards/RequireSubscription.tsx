import { useState } from 'react';
import { useSubscription } from '../../hooks/useSubscription';
import { PricingPlans } from '../pricing/PricingPlans';

interface RequireSubscriptionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequireSubscription({ 
  children, 
  fallback 
}: RequireSubscriptionProps) {
  const { hasAccess } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);
  
  if (!hasAccess()) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <>
        <div className="text-center p-4 bg-white rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-2">
            Premium Feature
          </h3>
          <p className="text-gray-600 mb-4">
            This feature requires an active subscription
          </p>
          <button 
            onClick={() => setShowUpgrade(true)}
            className="btn btn-primary"
          >
            Upgrade Now
          </button>
        </div>
        {showUpgrade && (
          <PricingPlans 
            isOpen={showUpgrade} 
            onClose={() => setShowUpgrade(false)} 
          />
        )}
      </>
    );
  }
  
  return <>{children}</>;
} 