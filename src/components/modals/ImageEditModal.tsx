import { useState } from 'react'
import { X } from 'lucide-react'
import { MapPreviewBackground } from '@/components/preview/MapPreviewBackground'

interface ImageEditModalProps {
  isOpen: boolean
  onClose: () => void
  initialStyle?: {
    backgroundColor: string
    borderColor: string
    borderWidth: number
    padding: number
    backgroundOpacity: number
    borderOpacity: number
  }
  imageUrl: string
  onSave: (style: {
    backgroundColor: string
    borderColor: string
    borderWidth: number
    padding: number
    backgroundOpacity: number
    borderOpacity: number
  }) => void
}

const defaultStyle = {
  backgroundColor: '#FFFFFF',
  borderColor: '#000000',
  borderWidth: 1,
  padding: 8,
  backgroundOpacity: 1,
  borderOpacity: 1
}

export function ImageEditModal({
  isOpen,
  onClose,
  initialStyle = defaultStyle,
  imageUrl,
  onSave
}: ImageEditModalProps) {
  const [backgroundColor, setBackgroundColor] = useState(initialStyle.backgroundColor)
  const [borderColor, setBorderColor] = useState(initialStyle.borderColor)
  const [borderWidth, setBorderWidth] = useState(initialStyle.borderWidth)
  const [padding, setPadding] = useState(initialStyle.padding)
  const [backgroundOpacity, setBackgroundOpacity] = useState(initialStyle.backgroundOpacity)
  const [borderOpacity, setBorderOpacity] = useState(initialStyle.borderOpacity)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      backgroundColor,
      borderColor,
      borderWidth,
      padding,
      backgroundOpacity,
      borderOpacity
    })
    onClose()
  }

  const getRgbaColor = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900">
            Edit Image Style
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Preview Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <MapPreviewBackground>
              <div
                style={{
                  backgroundColor: getRgbaColor(backgroundColor, backgroundOpacity),
                  border: `${borderWidth}px solid ${getRgbaColor(borderColor, borderOpacity)}`,
                  padding: `${padding}px`,
                  borderRadius: '4px',
                  maxWidth: '50%',
                  overflow: 'hidden'
                }}
              >
                {imageUrl && (
                  <img
                    key={imageUrl}
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-auto rounded"
                    style={{ 
                      maxHeight: '100px',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                    onError={(e) => {
                      console.error('Error loading image:', e)
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
              </div>
            </MapPreviewBackground>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Background
              </label>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-full h-8"
              />
              <div className="mt-2">
                <label className="block text-sm text-gray-600 mb-1">
                  Opacity: {Math.round(backgroundOpacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={backgroundOpacity}
                  onChange={(e) => setBackgroundOpacity(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Border Color
              </label>
              <input
                type="color"
                value={borderColor}
                onChange={(e) => setBorderColor(e.target.value)}
                className="w-full h-8"
              />
              <div className="mt-2">
                <label className="block text-sm text-gray-600 mb-1">
                  Opacity: {Math.round(borderOpacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={borderOpacity}
                  onChange={(e) => setBorderOpacity(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Border Width
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={borderWidth}
                  onChange={(e) => setBorderWidth(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500 w-12">
                  {borderWidth}px
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Padding
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={padding}
                  onChange={(e) => setPadding(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500 w-12">
                  {padding}px
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}