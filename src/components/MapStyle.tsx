import { useState, useRef, useEffect } from 'react'
import { Map } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MapStyleName } from '@/lib/map/styles'

interface MapStyleProps {
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

export function MapStyle({
  currentStyle,
  labelStates,
  highlightHighways,
  onStyleChange
}: MapStyleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const styleMenuRef = useRef<HTMLDivElement>(null)

  // Handle clicks outside of the style menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (styleMenuRef.current && !styleMenuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLabelChange = (type: keyof typeof labelStates, checked: boolean) => {
    let newStates = { ...labelStates }

    if (type === 'hideAllLabels') {
      // When "Hide All Labels" is checked, check all other label options
      newStates = Object.keys(labelStates).reduce((acc, key) => ({
        ...acc,
        [key]: checked
      }), {} as typeof labelStates)
    } else {
      // When individual options are changed
      newStates = {
        ...newStates,
        [type]: checked,
        // Check if all individual options are checked
        hideAllLabels: Object.keys(newStates)
          .filter(key => key !== 'hideAllLabels')
          .every(key => key === type ? checked : newStates[key as keyof typeof labelStates])
      }
    }

    onStyleChange({
      type: currentStyle,
      ...newStates,
      highlightHighways: highlightHighways.enabled ? {
        color: highlightHighways.color,
        weight: highlightHighways.weight
      } : undefined
    })
  }

  const handleHighwayToggle = (enabled: boolean) => {
    onStyleChange({
      type: currentStyle,
      ...labelStates,
      highlightHighways: enabled ? {
        color: highlightHighways.color,
        weight: highlightHighways.weight
      } : undefined
    })
  }

  const handleHighwayColorChange = (color: string) => {
    if (highlightHighways.enabled) {
      onStyleChange({
        type: currentStyle,
        ...labelStates,
        highlightHighways: {
          color,
          weight: highlightHighways.weight
        }
      })
    }
  }

  const handleHighwayWeightChange = (weight: number) => {
    if (highlightHighways.enabled) {
      onStyleChange({
        type: currentStyle,
        ...labelStates,
        highlightHighways: {
          color: highlightHighways.color,
          weight
        }
      })
    }
  }

  const handleBaseStyleChange = (type: MapStyleName | 'satellite' | 'terrain') => {
    onStyleChange({
      type,
      ...labelStates,
      highlightHighways: highlightHighways.enabled ? {
        color: highlightHighways.color,
        weight: highlightHighways.weight
      } : undefined
    })
  }

  return (
    <div className="relative" ref={styleMenuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'px-4 h-full flex items-center space-x-2 hover:bg-gray-50 focus:outline-none border-b-2',
          isOpen ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'
        )}
      >
        <Map className="h-5 w-5" />
        <span className="text-sm font-medium">Style</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-96 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-4 space-y-4">
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
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleBaseStyleChange(type.id as MapStyleName | 'satellite' | 'terrain')}
                    className={cn(
                      "px-3 py-2 text-sm font-medium rounded-md",
                      currentStyle === type.id
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    )}
                  >
                    {type.label}
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
                    checked={labelStates.hideAllLabels}
                    onChange={(e) => handleLabelChange('hideAllLabels', e.target.checked)}
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
                        checked={labelStates[key as keyof typeof labelStates]}
                        onChange={(e) => handleLabelChange(key as keyof typeof labelStates, e.target.checked)}
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
                    checked={highlightHighways.enabled}
                    onChange={(e) => handleHighwayToggle(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Enable</span>
                </label>
              </div>
              <div className={cn(
                "grid grid-cols-2 gap-2 transition-opacity",
                !highlightHighways.enabled && "opacity-50 pointer-events-none"
              )}>
                <input
                  type="color"
                  value={highlightHighways.color}
                  onChange={(e) => handleHighwayColorChange(e.target.value)}
                  className="w-full h-8"
                />
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={highlightHighways.weight}
                    onChange={(e) => handleHighwayWeightChange(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 w-12">
                    {highlightHighways.weight}px
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}