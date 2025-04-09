import { useEffect, useRef, useCallback } from 'react'
import { loader } from '@/lib/google-maps'
import { createSubjectPropertyOverlay } from '../overlays/SubjectPropertyOverlay'
import type { MapData, MapOverlay } from '@/lib/types'

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
      cleanupSubjectProperty()

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
      if (mapData.mapStyle.type === 'satellite') {
        googleMapRef.current.setMapTypeId('satellite')
      } else if (mapData.mapStyle.type === 'terrain') {
        googleMapRef.current.setMapTypeId('terrain')
      } else {
        googleMapRef.current.setMapTypeId('roadmap')
      }

      if (mapData.mapStyle.customStyles) {
        googleMapRef.current.setOptions({ styles: mapData.mapStyle.customStyles })
      }
    }
  }, [mapData.mapStyle])

  return { googleMapRef, drawingManagerRef, setDrawingMode, getSafePosition }
}