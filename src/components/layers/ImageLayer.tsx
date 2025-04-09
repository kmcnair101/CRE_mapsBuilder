import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageLayerProps {
  onAdd: (file: File) => void
  isActive: boolean
  onToggle: () => void
  onClose?: () => void
}

export function ImageLayer({ onAdd, isActive, onToggle, onClose }: ImageLayerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onAdd(e.target.files[0])
      onClose?.()
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAdd(e.dataTransfer.files[0])
      onClose?.()
    }
  }

  if (!isActive) {
    return (
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center justify-center w-full px-3 py-2 text-sm font-medium rounded-md focus:outline-none',
          isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        )}
      >
        <Upload className="h-4 w-4 mr-2" />
        Upload Image
      </button>
    )
  }

  return (
    <div className="p-4">
      <div
        className={cn(
          'border-2 border-dashed rounded-lg transition-colors cursor-pointer',
          isDragging ? 'border-blue-500 bg-blue-50' : 'hover:border-blue-500 border-gray-300',
          'p-8'
        )}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="h-10 w-10 text-gray-400" />
          <p className="text-sm text-gray-600 text-center">
            Drag and drop an image here<br />
            or click to browse
          </p>
          <p className="text-xs text-gray-500">
            Supports: JPG, PNG, GIF, SVG
          </p>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  )
}