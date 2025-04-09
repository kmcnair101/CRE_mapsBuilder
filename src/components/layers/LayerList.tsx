import { Trash2 } from 'lucide-react'
import type { MapOverlay } from '@/lib/types'

interface LayerListProps {
  layers: MapOverlay[]
  onDelete: (id: string) => void
  onSelect: (id: string) => void
  selectedLayer: string | null
}

export function LayerList({ layers, onDelete, onSelect, selectedLayer }: LayerListProps) {
  if (layers.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">
        No layers added yet
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {layers.map((layer) => (
        <div
          key={layer.id}
          onClick={() => onSelect(layer.id)}
          className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
            selectedLayer === layer.id ? 'bg-blue-50' : 'hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900">
              {layer.type.charAt(0).toUpperCase() + layer.type.slice(1)}
            </span>
            {layer.type === 'text' && (
              <span className="text-sm text-gray-500">
                {layer.properties.content?.slice(0, 20)}
                {(layer.properties.content?.length || 0) > 20 ? '...' : ''}
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(layer.id)
            }}
            className="text-gray-400 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}