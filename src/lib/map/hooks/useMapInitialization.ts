import { useEffect, useRef, useCallback } from 'react'
import { loader } from '@/lib/google-maps'
import { createSubjectPropertyOverlay } from '../overlays/SubjectPropertyOverlay'
import type { MapData, MapOverlay } from '@/lib/types'
import { useMapStyle } from './useMapStyle'

interface MapInitializationProps {
  setMapData: (updater: (prev: MapData) => MapData) => void
}

export function useMapInitialization(
  mapRef: React.RefObject<HTMLDivElement>,
  mapData: MapData,
  addOverlayToMap: (overlay: MapOverlay, map: google.maps.Map) => void,
  { setMapData }: MapInitializationProps
) {
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null)
  const subjectPropertyOverlayRef = useRef<google.maps.OverlayView | null>(null)
  const isInitializedRef = useRef(false)
  const { handleMapStyleChange } = useMapStyle()

  const cleanupSubjectProperty = useCallback(() => {
    if (subjectPropertyOverlayRef.current) {
      subjectPropertyOverlayRef.current.setMap(null)
      subjectPropertyOverlayRef.current = null
    }
  }, [])

  const updateSubjectProperty = useCallback(async () => {
    if (!googleMapRef.current || !mapData.subject_property) {
      cleanupSubjectProperty()
      return
    }

    try {
      // Only create a new overlay if one doesn't exist
      if (!subjectPropertyOverlayRef.current) {
        console.log('[useMapInitialization] Creating new subject property overlay')
        const overlay = await createSubjectPropertyOverlay(
          mapData,
          (updates) => {
            setMapData(prev => ({
              ...prev,
              subject_property: prev.subject_property ? {
                ...prev.subject_property,
                ...updates
              } : null
            }))
          }
        )

        overlay.setMap(googleMapRef.current)
        subjectPropertyOverlayRef.current = overlay
      } else {
        console.log('[useMapInitialization] Subject property overlay already exists')
      }
    } catch (error) {
      console.error('Error creating subject property overlay:', error)
    }
  }, [mapData, setMapData, cleanupSubjectProperty])

  const setDrawingMode = useCallback((mode: google.maps.drawing.OverlayType | null) => {
    if (drawingManagerRef.current) {
      drawingManagerRef.current.setDrawingMode(mode)
    }
  }, [])

  const getSafePosition = useCallback((map: google.maps.Map): google.maps.LatLng => {
    const center = map.getCenter()
    
    if (!mapData.subject_property) {
      return center
    }
    
    const subjectPos = new google.maps.LatLng(
      mapData.subject_property.lat,
      mapData.subject_property.lng
    )
    
    const distance = google.maps.geometry.spherical.computeDistanceBetween(center, subjectPos)
    
    if (distance > 50) {
      return center
    }
    
    const zoom = map.getZoom() || 15
    const offsetMeters = 200 / Math.pow(2, zoom - 15)
    
    return google.maps.geometry.spherical.computeOffset(
      subjectPos,
      offsetMeters,
      45
    )
  }, [mapData.subject_property])

  useEffect(() => {
    if (isInitializedRef.current || !mapRef.current) return

    async function initializeMap() {
      try {
        await loader.load()
        
        // Store initial container size
        const containerSize = {
          width: mapRef.current!.offsetWidth,
          height: mapRef.current!.offsetHeight
        }
        
        // Create map with saved center and zoom
        const map = new google.maps.Map(mapRef.current!, {
          center: { lat: mapData.center_lat, lng: mapData.center_lng },
          zoom: mapData.zoom_level,
          clickableIcons: false,
          disableDoubleClickZoom: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          gestureHandling: 'greedy',
          styles: [
            {
              featureType: 'poi.business',
              elementType: 'all',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'poi.park',
              elementType: 'all',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'poi.government',
              elementType: 'all',
              stylers: [{ visibility: 'off' }]
            },
            {
              featureType: 'transit',
              stylers: [{ clickable: false }]
            },
            {
              featureType: 'road',
              stylers: [{ clickable: false }]
            }
          ]
        })

        googleMapRef.current = map

        // Wait for map to be fully loaded and centered
        await new Promise<void>((resolve) => {
          const checkMapReady = () => {
            const currentCenter = map.getCenter()
            const currentZoom = map.getZoom()
            
            if (currentCenter && currentZoom) {
              const centerLat = currentCenter.lat()
              const centerLng = currentCenter.lng()
              
              // Check if map is centered and zoomed correctly
              const isCentered = Math.abs(centerLat - mapData.center_lat) < 0.0001 && 
                               Math.abs(centerLng - mapData.center_lng) < 0.0001
              const isZoomed = Math.abs(currentZoom - mapData.zoom_level) < 0.1
              
              if (isCentered && isZoomed) {
                resolve()
              } else {
                // If not centered/zoomed correctly, set them again
                const newCenter = new google.maps.LatLng(mapData.center_lat, mapData.center_lng)
                map.setCenter(newCenter as google.maps.LatLng)
                map.setZoom(mapData.zoom_level)
                setTimeout(checkMapReady, 100)
              }
            } else {
              setTimeout(checkMapReady, 100)
            }
          }
          
          google.maps.event.addListenerOnce(map, 'idle', checkMapReady)
        })

        // Verify container size hasn't changed
        if (mapRef.current!.offsetWidth !== containerSize.width || 
            mapRef.current!.offsetHeight !== containerSize.height) {
          console.warn('Map container size changed during initialization')
        }

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

        // Add a small delay before adding overlays to ensure map is fully rendered
        await new Promise(resolve => setTimeout(resolve, 500))

        // Add overlays
        mapData.overlays.forEach(overlay => {
          addOverlayToMap(overlay, map)
        })

        if (mapData.subject_property) {
          await updateSubjectProperty()
        }

        isInitializedRef.current = true
      } catch (error) {
        console.error('Error initializing map:', error)
      }
    }

    initializeMap()

    return () => {
      cleanupSubjectProperty()
    }
  }, [mapRef, mapData.center_lat, mapData.center_lng, mapData.zoom_level, addOverlayToMap, updateSubjectProperty, cleanupSubjectProperty])

  useEffect(() => {
    if (isInitializedRef.current) {
      updateSubjectProperty()
    }
  }, [
    updateSubjectProperty,
    mapData.subject_property?.lat,
    mapData.subject_property?.lng,
    mapData.subject_property?.image,
    mapData.subject_property?.name,
    JSON.stringify(mapData.subject_property?.style)
  ])

  useEffect(() => {
    if (googleMapRef.current) {
      googleMapRef.current.setCenter({ lat: mapData.center_lat, lng: mapData.center_lng })
      googleMapRef.current.setZoom(mapData.zoom_level)
    }
  }, [mapData.center_lat, mapData.center_lng, mapData.zoom_level])

  useEffect(() => {
    if (googleMapRef.current && mapData.mapStyle) {
      handleMapStyleChange(googleMapRef.current, mapData.mapStyle)
    }
  }, [mapData.mapStyle])

  return { googleMapRef, drawingManagerRef, setDrawingMode, getSafePosition }
}