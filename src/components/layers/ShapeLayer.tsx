import { useState } from 'react'
import { Square, Circle, Hexagon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShapeLayerProps {
  onAdd: (shape: {
    type: 'rect' | 'circle' | 'polygon'
    fill: string
    stroke: string
    strokeWidth: number
    opacity: number
  }) => void
  isActive: boolean
  onToggle: () => void
  onClose?: () => void
  activeDrawingShape: 'rect' | 'circle' | 'polygon' | null
}

export function ShapeLayer({ 
  onAdd, 
  isActive, 
  onToggle, 
  onClose,
  activeDrawingShape
}: ShapeLayerProps) {
  const [fill, setFill] = useState('#FFFFFF')
  const [stroke, setStroke] = useState('#000000')
  const [strokeWidth, setStrokeWidth] = useState(2)
  const [opacity, setOpacity] = useState(0.5)

  const handleShapeSelect = (type: 'rect' | 'circle' | 'polygon') => {
    // Add the shape to the map
    onAdd({
      type,
      fill,
      stroke,
      strokeWidth,
      opacity
    })

    // Close the menu
    onClose?.()
  }

  if (!isActive) {
    return (
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center justify-center w-full px-3 py-2 text-sm font-medium rounded-md focus:outline-none',
          activeDrawingShape ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        )}
      >
        <Square className="h-4 w-4 mr-2" />
        {activeDrawingShape ? 
          `Drawing ${activeDrawingShape === 'rect' ? 'Rectangle' : 
                    activeDrawingShape === 'circle' ? 'Circle' : 
                    'Polygon'}` : 
          'Draw Shapes'}
      </button>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => handleShapeSelect('rect')}
          className={cn(
            'flex flex-col items-center justify-center p-3 rounded-md',
            activeDrawingShape === 'rect' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          <Square className="h-6 w-6" />
          <span className="text-xs mt-1">Rectangle</span>
        </button>
        <button
          onClick={() => handleShapeSelect('circle')}
          className={cn(
            'flex flex-col items-center justify-center p-3 rounded-md',
            activeDrawingShape === 'circle' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          <Circle className="h-6 w-6" />
          <span className="text-xs mt-1">Circle</span>
        </button>
        <button
          onClick={() => handleShapeSelect('polygon')}
          className={cn(
            'flex flex-col items-center justify-center p-3 rounded-md',
            activeDrawingShape === 'polygon' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          <Hexagon className="h-6 w-6" />
          <span className="text-xs mt-1">Polygon</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fill Color
          </label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={fill}
              onChange={(e) => setFill(e.target.value)}
              className="w-full h-8"
            />
            <div className="w-28">
              <label className="block text-xs text-gray-600">
                Opacity: {Math.round(opacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stroke Color
          </label>
          <div className="flex gap-3 items-center">
            <input
              type="color"
              value={stroke}
              onChange={(e) => setStroke(e.target.value)}
              className="w-full h-8"
            />
            <div className="w-28">
              <label className="block text-xs text-gray-600">
                Width: {strokeWidth}px
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}