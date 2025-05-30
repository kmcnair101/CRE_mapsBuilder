import { Download, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSubscription } from '@/hooks/useSubscription'
import { useState, useContext } from 'react'
import { PricingPlans } from './pricing/PricingPlans'
// import or define MapEditorContext if not already done
// import { MapEditorContext } from '@/context/MapEditorContext'

interface DownloadButtonProps {
  onDownload: () => void
  className?: string
  loading?: boolean
  handleSaveOnly?: () => Promise<void>
}

export function DownloadButton({ onDownload, className, loading = false, handleSaveOnly }: DownloadButtonProps) {
  const { hasAccess } = useSubscription()
  const [showPricingPlans, setShowPricingPlans] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

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
          setShowPricingPlans(false)
        }} 
        onSave={handleSaveOnly}
      />
    </>
  )
}