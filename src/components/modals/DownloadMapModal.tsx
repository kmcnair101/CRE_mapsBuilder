import React, { useRef, useEffect, useState } from 'react'
import { useMapInitialization } from '@/lib/map/hooks/useMapInitialization'
import { useMapOverlays } from '@/lib/map/hooks/useMapOverlays'
import { useMapDownload } from '@/lib/map/hooks/useMapDownload'
import { X } from 'lucide-react'

interface DownloadMapModalProps {
  open: boolean
  width: number
  height: number
  onWidthChange: (width: number) => void
  onHeightChange: (height: number) => void
  onClose: () => void
  onDownload: (center: { lat: number, lng: number }, zoom: number) => void
  mapRef: React.RefObject<HTMLDivElement>
  mapData: any
}

export function DownloadMapModal({
  open,
  width,
  height,
  onWidthChange,
  onHeightChange,
  onClose,
  onDownload,
  mapRef,
  mapData
}: DownloadMapModalProps) {
  if (!open) return null

  const previewMapRef = useRef<HTMLDivElement>(null)
  const [previewMapData, setPreviewMapData] = useState(() => JSON.parse(JSON.stringify(mapData)))
  const [downloading, setDownloading] = useState(false)
  const { handleDownload } = useMapDownload()
  
  const { addOverlayToMap } = useMapOverlays(
    () => {}, // no-op for handleDeleteLayer
    undefined, // handleTextEdit
    undefined, // handleContainerEdit
    undefined, // handleShapeEdit,
    undefined, // handlePositionUpdate
    true // Add this parameter to indicate preview mode
  )

  const { googleMapRef } = useMapInitialization(
    previewMapRef,
    previewMapData,
    addOverlayToMap,
    { setMapData: setPreviewMapData }
  )

  // Add a ref to track if we've already initialized
  const isInitializedRef = useRef(false)

  useEffect(() => {
    if (!open || isInitializedRef.current) {
      return
    }

    // Set preview data only once when modal opens
    setPreviewMapData((prev: typeof mapData) => {
      const newData = {
        ...prev,
        subject_property: mapData.subject_property
      }
      return newData
    })

    isInitializedRef.current = true

    return () => {
      isInitializedRef.current = false
    }
  }, [open]) // Remove mapData.subject_property from dependencies

  // Sync preview map with main map data
  useEffect(() => {
    if (open && googleMapRef.current) {
      const map = googleMapRef.current

      // Update map center and zoom
      map.setCenter({ lat: mapData.center_lat, lng: mapData.center_lng })
      map.setZoom(mapData.zoom_level)

      // Apply map style
      if (mapData.mapStyle) {
        if (mapData.mapStyle.type === 'satellite') {
          map.setMapTypeId('satellite')
        } else if (mapData.mapStyle.type === 'terrain') {
          map.setMapTypeId('terrain')
        } else {
          map.setMapTypeId('roadmap')
        }

        if (mapData.mapStyle.customStyles) {
          map.setOptions({ styles: mapData.mapStyle.customStyles })
        }
      }
    }
  }, [open, mapData, googleMapRef.current])
  
  const [previewCenter, setPreviewCenter] = useState<{ lat: number, lng: number } | null>(null)
  const [previewZoom, setPreviewZoom] = useState<number | null>(null)

  useEffect(() => {
    if (mapData && mapData.center_lat && mapData.center_lng && mapData.zoom_level !== undefined) {
      const center = { lat: mapData.center_lat, lng: mapData.center_lng }
      setPreviewCenter(center)
      setPreviewZoom(mapData.zoom_level)
    }
  }, [mapData])

  useEffect(() => {
    if (!googleMapRef.current) {
      return
    }
    const map = googleMapRef.current

    const update = () => {
      const center = map.getCenter()
      const zoom = map.getZoom()
      if (center) {
        setPreviewCenter(prev => {
          const newVal = { lat: center.lat(), lng: center.lng() }
          return newVal
        })
      }
      if (zoom !== undefined) {
        setPreviewZoom(prev => {
          return zoom
        })
      }
    }

    map.addListener('center_changed', update)
    map.addListener('zoom_changed', update)
    update()

    return () => {
      google.maps.event.clearListeners(map, 'center_changed')
      google.maps.event.clearListeners(map, 'zoom_changed')
    }
  }, [googleMapRef.current])

  const handlePreviewDownload = async () => {
    if (!previewCenter || previewZoom === null) {
      return
    }
    setDownloading(true)
    try {
      const result = await handleDownload(previewMapRef, false, width, height, googleMapRef)
      onClose()
    } catch (error) {
    } finally {
      setDownloading(false)
    }
  }

  // Get main map dimensions
  const mainMapWidth = mapRef.current?.offsetWidth || 800
  const mainMapHeight = mapRef.current?.offsetHeight || 600

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full h-full flex">
        {/* Left Section (Controls) */}
        <div className="w-56 p-4 border-r bg-gray-50 flex flex-col">
          <div className="space-y-6">
            <div>
              <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-2">
                Width (px)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  id="width"
                  min="100"
                  max="2000"
                  value={width}
                  onChange={(e) => onWidthChange(Math.min(2000, Math.max(100, parseInt(e.target.value) || 100)))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500 w-16">{width}px</span>
              </div>
            </div>
            <div>
              <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-2">
                Height (px)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  id="height"
                  min="100"
                  max="2000"
                  value={height}
                  onChange={(e) => onHeightChange(Math.min(2000, Math.max(100, parseInt(e.target.value) || 100)))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500 w-16">{height}px</span>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handlePreviewDownload}
                disabled={downloading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloading ? 'Downloading...' : 'Download'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Section (Preview) */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full max-h-full flex items-center justify-center">
              <div className="w-full h-full relative shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                <div 
                  ref={previewMapRef} 
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}