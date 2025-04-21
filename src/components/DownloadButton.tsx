import { Download } from 'lucide-react'
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
    if (!hasAccess()) {
      setShowPricingPlans(true)
      return
    }
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
          !hasAccess() && 'opacity-50 cursor-not-allowed',
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
            <Download className="h-4 w-4 mr-1.5 flex-shrink-0" />
            <span>{hasAccess() ? 'Download' : 'Subscribe to Download'}</span>
          </>
        )}
      </button>

      <PricingPlans 
        isOpen={showPricingPlans} 
        onClose={() => setShowPricingPlans(false)} 
      />
    </>
  )
}