import type { MapData } from '@/lib/types'
import { loader } from '@/lib/google-maps'
import { createCustomImageOverlay } from '../map/utils/customOverlays'
import { createBusinessLogoOverlay } from '../map/overlays/BusinessLogoOverlay'
import { createCustomTextOverlay } from '../map/utils/customOverlays'

interface MapIframeConfig {
  width: number
  height: number
  mapData: MapData
  container: HTMLElement
  interactive?: boolean
  showControls?: boolean
}

export async function createMapIframe(config: MapIframeConfig) {
  const { width, height, mapData, container, interactive = true, showControls = true } = config

  // Set container dimensions
  container.style.width = `${width}px`
  container.style.height = `${height}px`

  // Load Google Maps
  await loader.load()

  // Create map instance
  const map = new google.maps.Map(container, {
    center: { lat: mapData.center_lat, lng: mapData.center_lng },
    zoom: mapData.zoom_level,
    disableDefaultUI: !showControls,
    gestureHandling: interactive ? 'auto' : 'none',
    clickableIcons: false,
    styles: mapData.mapStyle?.customStyles
  })

  // Add subject property marker if exists
  if (mapData.subject_property) {
    new google.maps.Marker({
      position: {
        lat: mapData.subject_property.lat,
        lng: mapData.subject_property.lng
      },
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#3B82F6',
        fillOpacity: 0.7,
        strokeColor: '#2563EB',
        strokeWeight: 2
      },
      title: mapData.subject_property.name || 'Subject Property'
    })
  }

  // Add overlays
  mapData.overlays.forEach(overlay => {
    switch (overlay.type) {
      case 'image': {
        createCustomImageOverlay(
          {
            position: new google.maps.LatLng(overlay.position.lat, overlay.position.lng),
            url: overlay.properties.url || '',
            width: overlay.properties.width || 200,
            style: {
              backgroundColor: overlay.properties.containerStyle?.backgroundColor || '#FFFFFF',
              borderColor: overlay.properties.containerStyle?.borderColor || '#000000',
              borderWidth: overlay.properties.containerStyle?.borderWidth || 1,
              padding: overlay.properties.containerStyle?.padding || 8,
              backgroundOpacity: overlay.properties.containerStyle?.backgroundOpacity || 1,
              borderOpacity: overlay.properties.containerStyle?.borderOpacity || 1
            }
          },
          map,
          () => {}, // No-op for delete in iframe
          () => null, // No delete button
          () => null, // No edit button
          undefined, // No edit callback
          () => null // No resize handle
        )
        break
      }
      case 'business': {
        createBusinessLogoOverlay(
          {
            position: new google.maps.LatLng(overlay.position.lat, overlay.position.lng),
            logo: overlay.properties.logo || '',
            businessName: overlay.properties.businessName || '',
            width: overlay.properties.width || 200,
            style: {
              backgroundColor: overlay.properties.containerStyle?.backgroundColor || '#FFFFFF',
              borderColor: overlay.properties.containerStyle?.borderColor || '#000000',
              borderWidth: overlay.properties.containerStyle?.borderWidth || 1,
              padding: overlay.properties.containerStyle?.padding || 8,
              backgroundOpacity: overlay.properties.containerStyle?.backgroundOpacity || 1,
              borderOpacity: overlay.properties.containerStyle?.borderOpacity || 1
            }
          },
          map,
          () => {}, // No-op for delete in iframe
          () => null, // No delete button
          () => null, // No edit button
          undefined, // No edit callback
          () => null // No resize handle
        )
        break
      }
      case 'text': {
        createCustomTextOverlay(
          overlay,
          map,
          () => {}, // No-op for delete in iframe
          () => null, // No delete button
          () => null, // No edit button
          undefined, // No edit callback
          () => null // No resize handle
        )
        break
      }
    }
  })

  return {
    map,
    centerMap: () => {
      if (mapData.subject_property) {
        map.setCenter({
          lat: mapData.subject_property.lat,
          lng: mapData.subject_property.lng
        })
      }
    },
    downloadMap: async () => {
      const canvas = await html2canvas(container, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 2,
        logging: false
      })
      return canvas.toDataURL('image/png', 1.0)
    }
  }
}