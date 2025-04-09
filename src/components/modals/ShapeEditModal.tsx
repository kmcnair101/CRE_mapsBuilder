import { useState } from 'react'
import { X } from 'lucide-react'

interface ShapeEditModalProps {
  isOpen: boolean
  onClose: () => void
  initialStyle: {
    fillColor: string
    fillOpacity: number
    strokeColor: string
    strokeOpacity: number
    strokeWeight: number
  }
  onSave: (style: {
    fillColor: string
    fillOpacity: number
    strokeColor: string
    strokeOpacity: number
    strokeWeight: number
  }) => void
}

export function ShapeEditModal({
  isOpen,
  onClose,
  initialStyle,
  onSave
}: ShapeEditModalProps) {
  const [fillColor, setFillColor] = useState(initialStyle.fillColor)
  const [fillOpacity, setFillOpacity] = useState(initialStyle.fillOpacity)
  const [strokeColor, setStrokeColor] = useState(initialStyle.strokeColor)
  const [strokeOpacity, setStrokeOpacity] = useState(initialStyle.strokeOpacity)
  const [strokeWeight, setStrokeWeight] = useState(initialStyle.strokeWeight)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      fillColor,
      fillOpacity,
      strokeColor,
      strokeOpacity,
      strokeWeight
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900">
            Edit Shape Style
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Preview */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex justify-center">
              <div
                className="w-32 h-32 rounded-lg"
                style={{
                  backgroundColor: fillColor,
                  opacity: fillOpacity,
                  border: `${strokeWeight}px solid ${strokeColor}`,
                  borderOpacity: strokeOpacity
                }}
              />
            </div>
          </div>

          {/* Fill Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fill Color
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="color"
                value={fillColor}
                onChange={(e) => setFillColor(e.target.value)}
                className="w-full h-8"
              />
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Opacity: {Math.round(fillOpacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={fillOpacity}
                  onChange={(e) => setFillOpacity(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Stroke Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stroke Color
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="w-full h-8"
              />
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Opacity: {Math.round(strokeOpacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={strokeOpacity}
                  onChange={(e) => setStrokeOpacity(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Stroke Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stroke Weight
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="1"
                max="10"
                value={strokeWeight}
                onChange={(e) => setStrokeWeight(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-500 w-12">
                {strokeWeight}px
              </span>
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