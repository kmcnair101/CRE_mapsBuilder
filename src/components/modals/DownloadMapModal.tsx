import React, { useRef, useEffect, useState } from 'react'
import { useMapInitialization } from '@/lib/map/hooks/useMapInitialization'
import { useMapOverlays } from '@/lib/map/hooks/useMapOverlays'
import { useMapDownload } from '@/lib/map/hooks/useMapDownload'
import { X } from 'lucide-react'
import { mapStyles } from '@/lib/map/styles'

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

  // Add this log
  console.log('[DownloadMapModal] Initializing with mapData:', {
    overlays: mapData.overlays,
    isPreview: true
  })

  const { googleMapRef } = useMapInitialization(
    previewMapRef,
    previewMapData,
    addOverlayToMap,
    { setMapData: setPreviewMapData }
  )

  // Add a ref to track if we've already initialized
  const isInitializedRef = useRef(false)

  // Add near the top of component to log initial state
  console.log('[DownloadMapModal] Initial mapStyle:', mapData.mapStyle);

  useEffect(() => {
    if (!open || isInitializedRef.current) return;

    // Log mapData being copied to preview
    console.log('[DownloadMapModal] Setting preview data with mapStyle:', {
      type: mapData.mapStyle?.type,
      hasStyles: !!mapData.mapStyle?.customStyles,
      mapData: mapData
    });

    // Set preview data only once when modal opens
    setPreviewMapData((prev: typeof mapData) => {
      const newData = {
        ...mapData, // Copy all mapData including mapStyle
        subject_property: mapData.subject_property,
        overlays: [...(mapData.overlays || [])],
        mapStyle: mapData.mapStyle // Explicitly copy mapStyle
      };
      
      // Log what's being set
      console.log('[DownloadMapModal] Preview data being set:', {
        type: newData.mapStyle?.type,
        hasStyles: !!newData.mapStyle?.customStyles
      });
      
      return newData;
    })

    isInitializedRef.current = true

    return () => {
      isInitializedRef.current = false
    }
  }, [open])

  // Add logging for preview map initialization
  useEffect(() => {
    if (open && googleMapRef.current) {
      const map = googleMapRef.current

      // Log preview map dimensions and scale
      console.log('[DownloadMapModal] Preview map dimensions:', {
        width: previewMapRef.current?.offsetWidth,
        height: previewMapRef.current?.offsetHeight,
        scale,
        mainMapWidth,
        mainMapHeight
      })

      // Log image overlays
      console.log('[DownloadMapModal] Image overlays:', previewMapData.overlays
        .filter(overlay => overlay.type === 'image')
        .map(overlay => ({
          id: overlay.id,
          position: overlay.position,
          properties: {
            width: overlay.properties.width,
            height: overlay.properties.height,
            url: overlay.properties.url,
            containerStyle: overlay.properties.containerStyle
          },
          scale
        }))
      )

      // Log business logo overlays
      console.log('[DownloadMapModal] Business logo overlays:', previewMapData.overlays
        .filter(overlay => overlay.type === 'business')
        .map(overlay => ({
          id: overlay.id,
          position: overlay.position,
          properties: {
            width: overlay.properties.width,
            height: overlay.properties.height,
            logo: overlay.properties.logo,
            businessName: overlay.properties.businessName,
            containerStyle: overlay.properties.containerStyle
          },
          scale
        }))
      )

      // Log polygon overlays
      console.log('[DownloadMapModal] Polygon overlays:', previewMapData.overlays
        .filter(overlay => overlay.type === 'shape' && overlay.properties.shapeType === 'polygon')
        .map(overlay => ({
          id: overlay.id,
          position: overlay.position,
          points: overlay.properties.points,
          scale
        }))
      )

      // Log all overlay positions after initialization
      console.log('[DownloadMapModal] All preview overlay positions:', previewMapData.overlays.map(overlay => ({
        id: overlay.id,
        type: overlay.type,
        position: overlay.position,
        properties: {
          width: overlay.properties.width,
          height: overlay.properties.height,
          // Include shape-specific properties
          ...(overlay.type === 'shape' && {
            shapeType: overlay.properties.shapeType,
            points: overlay.properties.points
          }),
          // Include image-specific properties
          ...(overlay.type === 'image' && {
            url: overlay.properties.url,
            containerStyle: overlay.properties.containerStyle
          }),
          // Include business-specific properties
          ...(overlay.type === 'business' && {
            logo: overlay.properties.logo,
            businessName: overlay.properties.businessName,
            containerStyle: overlay.properties.containerStyle
          })
        }
      })))

      // Update map center and zoom
      map.setCenter({ lat: mapData.center_lat, lng: mapData.center_lng })
      map.setZoom(mapData.zoom_level)

      // Log preview overlay positions after initialization
      console.log('[DownloadMapModal] Preview overlay positions:', previewMapData.overlays.map(overlay => ({
        id: overlay.id,
        type: overlay.type,
        position: overlay.position,
        properties: {
          width: overlay.properties.width,
          height: overlay.properties.height
        }
      })))

      // Apply map style
      if (mapData.mapStyle) {
        console.log('[DownloadMapModal] Style:', mapData.mapStyle.type);
        
        // Set basic map type immediately
        if (mapData.mapStyle.type === 'satellite') {
          map.setMapTypeId('satellite')
        } else if (mapData.mapStyle.type === 'terrain') {
          map.setMapTypeId('terrain')
        } else {
          map.setMapTypeId('roadmap')
        }

        console.log('[DownloadMapModal] Map type set, waiting for tiles to load...');
      }

      // Move all custom styling to the idle listener
      const idleListener = map.addListener('idle', () => {
        console.log('[DownloadMapModal] IDLE EVENT FIRED - Applying custom styles now');
        
        if (mapData.mapStyle) {
          // Apply custom styles AFTER tiles are loaded
          if (mapData.mapStyle.type !== 'satellite' && mapData.mapStyle.type !== 'terrain') {
            // Apply custom styles from the mapStyles object
            if (mapData.mapStyle.type in mapStyles) {
              const customStyles = mapStyles[mapData.mapStyle.type as keyof typeof mapStyles]
              map.setOptions({ styles: customStyles })
              console.log('[DownloadMapModal] Applied predefined styles for:', mapData.mapStyle.type)
            }
          }

          // Still check for custom styles from mapData
          if (mapData.mapStyle.customStyles) {
            map.setOptions({ styles: mapData.mapStyle.customStyles })
          }

          // Apply label hiding and highway highlighting
          const additionalStyles = []
          
          if (mapData.mapStyle.hideAllLabels || mapData.mapStyle.hideLabels) {
            additionalStyles.push({ featureType: 'all', elementType: 'labels', stylers: [{ visibility: 'off' }] })
          }
          
          if (mapData.mapStyle.hideStreetNames) {
            additionalStyles.push({ featureType: 'road', elementType: 'labels', stylers: [{ visibility: 'off' }] })
          }
          
          if (mapData.mapStyle.hideHighwayLabels) {
            additionalStyles.push({ featureType: 'road.highway', elementType: 'labels', stylers: [{ visibility: 'off' }] })
          }
          
          if (mapData.mapStyle.hideAreaLabels) {
            additionalStyles.push({ featureType: 'administrative', elementType: 'labels', stylers: [{ visibility: 'off' }] })
          }
          
          if (mapData.mapStyle.hideBusinessLabels) {
            additionalStyles.push({ featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] })
          }
          
          if (mapData.mapStyle.hideTransitLabels) {
            additionalStyles.push({ featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] })
          }
          
          if (mapData.mapStyle.hideWaterLabels) {
            additionalStyles.push({ featureType: 'water', elementType: 'labels', stylers: [{ visibility: 'off' }] })
          }
          
          if (mapData.mapStyle.highlightHighways) {
            additionalStyles.push({
              featureType: 'road.highway',
              elementType: 'geometry',
              stylers: [
                { color: mapData.mapStyle.highlightHighways.color },
                { weight: mapData.mapStyle.highlightHighways.weight }
              ]
            })
          }

          // Apply additional styles if any exist
          if (additionalStyles.length > 0) {
            const currentStyles = map.get('styles') || []
            map.setOptions({ styles: [...currentStyles, ...additionalStyles] })
            console.log('[DownloadMapModal] Applied label/highway customizations')
          }

          console.log('[DownloadMapModal] All styles applied after idle:', {
            currentType: map.getMapTypeId(),
            hasStyles: !!map.get('styles'),
            stylesCount: map.get('styles')?.length || 0
          });
        }
        
        google.maps.event.removeListener(idleListener);
      });

      console.log('[Map Context]', {
        width: mapRef.current?.offsetWidth,
        height: mapRef.current?.offsetHeight,
        center: { lat: map.getCenter().lat(), lng: map.getCenter().lng() },
        zoom: map.getZoom(),
        scale
      });
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

  // Add these for scaling the preview
  const previewAreaRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    if (!previewAreaRef.current) return
    const area = previewAreaRef.current.getBoundingClientRect()
    const scaleW = area.width / width
    const scaleH = area.height / height
    setScale(Math.min(scaleW, scaleH, 1)) // Don't upscale beyond 1:1
  }, [width, height, open])

  const [downloadModalOpen, setDownloadModalOpen] = useState(false);

  const handleOpenDownloadModal = () => {
    // Log overlay positions right before opening the modal
    console.log('[Before Modal Open] Overlay positions:', mapData.overlays.map(overlay => ({
      id: overlay.id,
      type: overlay.type,
      position: overlay.position,
      properties: overlay.properties
    })));
    setDownloadModalOpen(true);
  };

  return (
    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
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
                  max={mapRef.current?.offsetWidth || 2000}
                  value={width}
                  onChange={(e) => onWidthChange(Math.min(mapRef.current?.offsetWidth || 2000, Math.max(100, parseInt(e.target.value) || 100)))}
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
                  max={mapRef.current?.offsetHeight || 2000}
                  value={height}
                  onChange={(e) => onHeightChange(Math.min(mapRef.current?.offsetHeight || 2000, Math.max(100, parseInt(e.target.value) || 100)))}
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
          <div
            ref={previewAreaRef}
            className="absolute inset-0 flex items-center justify-center bg-gray-100"
          >
            <div
              style={{
                width: `${width}px`,
                height: `${height}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
              className="relative shadow-sm border border-gray-200 rounded-lg overflow-hidden bg-white"
            >
              <div
                ref={previewMapRef}
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}