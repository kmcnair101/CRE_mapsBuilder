import { Download, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSubscription } from '@/hooks/useSubscription'
import { useState } from 'react'
import { PricingPlans } from './pricing/PricingPlans'

interface DownloadButtonProps {
  onDownload: () => void
  className?: string
  loading?: boolean
}

export function DownloadButton({ onDownload, className, loading = false }: DownloadButtonProps) {
  const { hasAccess } = useSubscription()
  const [showPricingPlans, setShowPricingPlans] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('[DownloadButton] Button clicked')
    console.log('[DownloadButton] hasAccess() result:', hasAccess())
    
    if (!hasAccess()) {
      console.log('[DownloadButton] User does not have access, showing pricing plans')
      setShowPricingPlans(true)
      return
    }
    
    console.log('[DownloadButton] User has access, calling onDownload')
    onDownload()
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        title={!hasAccess() ? "Subscribe to download maps" : "Download map"}
        className={cn(
          'inline-flex items-center justify-center text-sm',
          !hasAccess() ? 'text-gray-400' : 'text-gray-700',
          className
        )}
      >
        {loading ? (
          <>
            <div className="animate-spin h-4 w-4 mr-1.5 flex-shrink-0 border-b-2 border-current rounded-full" />
            <span>Downloading...</span>
          </>
        ) : (
          <>
            {hasAccess() ? (
              <Download className="h-4 w-4 mr-1.5 flex-shrink-0" />
            ) : (
              <Lock className="h-4 w-4 mr-1.5 flex-shrink-0" />
            )}
            <span>Download</span>
          </>
        )}
      </button>

      <PricingPlans 
        isOpen={showPricingPlans} 
        onClose={() => {
          console.log('[DownloadButton] Pricing plans modal closed')
          setShowPricingPlans(false)
        }} 
      />
    </>
  )
}