import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MapStyleName } from '@/lib/map/styles'

interface MapStyleModalProps {
  isOpen: boolean
  onClose: () => void
  currentStyle: MapStyleName | 'satellite' | 'terrain'
  labelStates: {
    hideAllLabels: boolean
    hideStreetNames: boolean
    hideHighwayLabels: boolean
    hideAreaLabels: boolean
    hideBusinessLabels: boolean
    hideTransitLabels: boolean
    hideWaterLabels: boolean
  }
  highlightHighways: {
    enabled: boolean
    color: string
    weight: number
  }
  onStyleChange: (style: {
    type: MapStyleName | 'satellite' | 'terrain'
    hideLabels?: boolean
    hideStreetNames?: boolean
    hideHighwayLabels?: boolean
    hideAreaLabels?: boolean
    hideBusinessLabels?: boolean
    hideTransitLabels?: boolean
    hideWaterLabels?: boolean
    highlightHighways?: {
      color: string
      weight: number
    }
  }) => void
}

export function MapStyleModal({
  isOpen,
  onClose,
  currentStyle,
  labelStates,
  highlightHighways,
  onStyleChange
}: MapStyleModalProps) {
  const [selectedStyle, setSelectedStyle] = useState(currentStyle)
  const [labels, setLabels] = useState(labelStates)
  const [highways, setHighways] = useState(highlightHighways)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onStyleChange({
      type: selectedStyle,
      ...labels,
      highlightHighways: highways.enabled ? {
        color: highways.color,
        weight: highways.weight
      } : undefined
    })
  }

  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Map Style</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Base Style
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'default', label: 'Default' },
              { id: 'light', label: 'Light' },
              { id: 'dark', label: 'Dark' },
              { id: 'retro', label: 'Retro' },
              { id: 'silver', label: 'Silver' },
              { id: 'night', label: 'Night' },
              { id: 'satellite', label: 'Satellite' },
              { id: 'terrain', label: 'Terrain' }
            ].map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => setSelectedStyle(style.id as MapStyleName | 'satellite' | 'terrain')}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-md",
                  selectedStyle === style.id
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                )}
              >
                {style.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Map Labels
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={labels.hideAllLabels}
                onChange={(e) => setLabels(prev => ({
                  ...prev,
                  hideAllLabels: e.target.checked,
                  hideStreetNames: e.target.checked,
                  hideHighwayLabels: e.target.checked,
                  hideAreaLabels: e.target.checked,
                  hideBusinessLabels: e.target.checked,
                  hideTransitLabels: e.target.checked,
                  hideWaterLabels: e.target.checked
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">Hide All Labels</span>
            </label>
            <div className="ml-6 space-y-2">
              {[
                { key: 'hideStreetNames', label: 'Street Names' },
                { key: 'hideHighwayLabels', label: 'Highway Labels' },
                { key: 'hideAreaLabels', label: 'Neighborhoods & Communities' },
                { key: 'hideBusinessLabels', label: 'Business Labels' },
                { key: 'hideTransitLabels', label: 'Transit Labels' },
                { key: 'hideWaterLabels', label: 'Water Labels' }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={labels[key as keyof typeof labels]}
                    onChange={(e) => setLabels(prev => ({
                      ...prev,
                      [key]: e.target.checked,
                      hideAllLabels: e.target.checked && 
                        Object.keys(prev)
                          .filter(k => k !== 'hideAllLabels' && k !== key)
                          .every(k => prev[k as keyof typeof prev])
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Hide {label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Highway Highlight
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={highways.enabled}
                onChange={(e) => setHighways(prev => ({
                  ...prev,
                  enabled: e.target.checked
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">Enable</span>
            </label>
          </div>
          <div className={cn(
            "grid grid-cols-2 gap-2 transition-opacity",
            !highways.enabled && "opacity-50 pointer-events-none"
          )}>
            <input
              type="color"
              value={highways.color}
              onChange={(e) => setHighways(prev => ({
                ...prev,
                color: e.target.value
              }))}
              className="w-full h-8"
            />
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={highways.weight}
                onChange={(e) => setHighways(prev => ({
                  ...prev,
                  weight: parseInt(e.target.value)
                }))}
                className="w-full"
              />
              <span className="text-sm text-gray-500 w-12">
                {highways.weight}px
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
            Apply Style
          </button>
        </div>
      </form>
    </div>
  )
}