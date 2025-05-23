import React, { useRef, useEffect, useState } from 'react'
import { useMapInitialization } from '@/lib/map/hooks/useMapInitialization'
import { useMapOverlays } from '@/lib/map/hooks/useMapOverlays'
import { useMapDownload } from '@/lib/map/hooks/useMapDownload'

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

  // Increased maximum dimensions for the preview
  const maxPreviewWidth = 800 // Increased from 600 to 800
  const maxPreviewHeight = 600 // Increased from 450 to 600

  // Calculate dimensions while maintaining aspect ratio
  const aspectRatio = width / height
  let previewWidth = width
  let previewHeight = height

  if (width > maxPreviewWidth || height > maxPreviewHeight) {
    if (aspectRatio > maxPreviewWidth / maxPreviewHeight) {
      previewWidth = maxPreviewWidth
      previewHeight = maxPreviewWidth / aspectRatio
    } else {
      previewHeight = maxPreviewHeight
      previewWidth = Math.max(width, maxPreviewHeight * aspectRatio)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-6xl w-full h-[800px]">
        <h2 className="text-xl font-bold mb-4">Download Map</h2>
        <div className="flex gap-6">
          {/* Controls Section - Left Side */}
          <div className="w-1/3">
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
                    max="1000"
                    value={width}
                    onChange={(e) => onWidthChange(Math.min(1000, Math.max(100, parseInt(e.target.value) || 100)))}
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
                    max="1000"
                    value={height}
                    onChange={(e) => onHeightChange(Math.min(1000, Math.max(100, parseInt(e.target.value) || 100)))}
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

          {/* Preview Section - Right Side */}
          <div className="w-2/3">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Preview</h3>
            <div className="flex items-center justify-center">
              <div
                className="border border-gray-300 rounded shadow overflow-hidden"
                style={{
                  width: previewWidth,
                  height: previewHeight,
                  background: '#eee'
                }}
              >
                <div ref={previewMapRef} className="w-full h-full" />
              </div>
            </div>
            <span className="text-xs text-gray-500 mt-1 block text-center">
              Preview ({width} × {height})
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}