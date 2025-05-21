import { useRef } from 'react'
import type { MapOverlay } from '@/lib/types'
import { createDeleteButton, createEditButton, createResizeHandle } from '../utils/overlayControls'
import { createCustomImageOverlay } from '../utils/customOverlays'
import { createCustomTextOverlay } from '../utils/customOverlays'
import { createBusinessLogoOverlay } from '../overlays/BusinessLogoOverlay'
import { createGroupOverlay } from '../overlays/GroupOverlay'
import { createShapeOverlay } from '../overlays/ShapeOverlay'

export function useMapOverlays(
  handleDeleteLayer: (id: string) => void,
  handleTextEdit?: (id: string, text: string, style: any) => void,
  handleContainerEdit?: (id: string, style: any) => void,
  handleShapeEdit?: (id: string, style: any) => void,
  handlePositionUpdate?: (id: string, position: { lat: number, lng: number }) => void,
  isPreview?: boolean // Add this parameter
) {
  const overlaysRef = useRef<{
    [key: string]: google.maps.Marker | google.maps.OverlayView
  }>({})

  const removeOverlay = (id: string) => {
    const overlay = overlaysRef.current[id]
    if (overlay) {
      if ('setMap' in overlay) {
        overlay.setMap(null)
      }
      delete overlaysRef.current[id]
      handleDeleteLayer(id)
    }
  }

  const addOverlayToMap = (overlay: MapOverlay, map: google.maps.Map) => {
    if (isPreview) {
      // For preview, create new overlay instances without callbacks
      // This ensures preview overlays are independent of main map overlays
      return
    }

    try {
      // Remove existing overlay if it exists
      if (overlaysRef.current[overlay.id]) {
        removeOverlay(overlay.id)
      }

      switch (overlay.type) {
        case 'image': {
          const imageOverlay = createCustomImageOverlay(
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
            () => removeOverlay(overlay.id),
            createDeleteButton,
            createEditButton,
            (style: any) => handleContainerEdit?.(overlay.id, style),
            createResizeHandle
          )
          overlaysRef.current[overlay.id] = imageOverlay
          break
        }
        case 'business': {
          console.log('Initial position:', overlay.position);

          const businessOverlay = createBusinessLogoOverlay(
            {
              position: new google.maps.LatLng(overlay.position.lat, overlay.position.lng),
              logo: overlay.properties.logo || '',
              businessName: overlay.properties.businessName || '',
              width: overlay.properties.width || 200,
              style: {
                ...overlay.properties.containerStyle,
                // Add position absolute to ensure proper positioning
                position: 'absolute',
                transform: 'translate(-50%, -50%)'
              }
            },
            map,
            () => removeOverlay(overlay.id),
            createDeleteButton,
            createEditButton,
            (style: any) => {
              // Add position handling similar to text overlay
              if (style?.position) {
                handlePositionUpdate?.(overlay.id, style.position)
              }
              handleContainerEdit?.(overlay.id, style)
            },
            createResizeHandle
          )

          // Add position change listener
          google.maps.event.addListenerOnce(map, 'idle', () => {
            if (businessOverlay && 'getPosition' in businessOverlay) {
              handlePositionUpdate?.(overlay.id, {
                lat: businessOverlay.getPosition().lat(),
                lng: businessOverlay.getPosition().lng()
              })
            }
          })

          // Add multiple listeners to track position
          google.maps.event.addListener(map, 'bounds_changed', () => {
            if (businessOverlay && 'getPosition' in businessOverlay) {
              console.log('bounds_changed position:', businessOverlay.getPosition()?.toJSON());
            }
          });

          google.maps.event.addListener(map, 'zoom_changed', () => {
            if (businessOverlay && 'getPosition' in businessOverlay) {
              console.log('zoom_changed position:', businessOverlay.getPosition()?.toJSON());
            }
          });

          overlaysRef.current[overlay.id] = businessOverlay
          break
        }
        case 'text': {
          const textOverlay = createCustomTextOverlay(
            overlay,
            map,
            () => removeOverlay(overlay.id),
            createDeleteButton,
            createEditButton,
            (text: string, style: any) => {
              if (style?.position) {
                // Handle position updates
                handlePositionUpdate?.(overlay.id, style.position)
              } else {
                // Handle text/style updates
                handleTextEdit?.(overlay.id, text, style)
              }
            },
            createResizeHandle
          )
          overlaysRef.current[overlay.id] = textOverlay
          break
        }
        case 'group': {
          const groupOverlay = createGroupOverlay(
            overlay,
            map,
            () => removeOverlay(overlay.id),
            createDeleteButton,
            createEditButton,
            (style: any) => handleContainerEdit?.(overlay.id, style),
            createResizeHandle
          )
          overlaysRef.current[overlay.id] = groupOverlay
          break
        }
        case 'shape': {
          const shapeOverlay = createShapeOverlay(
            overlay,
            map,
            () => removeOverlay(overlay.id),
            createDeleteButton,
            createEditButton,
            (style: any) => handleShapeEdit?.(overlay.id, style)
          )
          overlaysRef.current[overlay.id] = shapeOverlay
          break
        }
      }
    } catch (error) {
      console.error('Error adding overlay to map:', error)
    }
  }
  return { overlaysRef, addOverlayToMap, removeOverlay }
}
