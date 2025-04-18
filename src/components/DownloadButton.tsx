import { Download } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DownloadButtonProps {
  onDownload: () => void
  className?: string
  loading?: boolean
}

export function DownloadButton({ onDownload, className, loading = false }: DownloadButtonProps) {
  return (
    <button
      onClick={onDownload}
      disabled={loading}
      className={cn(
        'inline-flex items-center justify-center text-sm disabled:opacity-50 disabled:cursor-not-allowed',
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
          <span>Download</span>
        </>
      )}
    </button>
  )
}