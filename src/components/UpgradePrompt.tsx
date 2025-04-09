import { Download } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UpgradePromptProps {
  onClick: () => void
  className?: string
  showText?: boolean
}

export function UpgradePrompt({ onClick, className, showText = true }: UpgradePromptProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center text-sm text-gray-600 hover:text-gray-500',
        className
      )}
    >
      <Download className="h-4 w-4 mr-1" />
      {showText && <span>Download</span>}
    </button>
  )
}