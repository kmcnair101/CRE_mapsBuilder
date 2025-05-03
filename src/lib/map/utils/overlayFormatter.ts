import type { MapOverlay } from '@/lib/types'
import { normalizeOverlay } from '@/lib/map/utils/overlayNormalizer'

// Default values for overlay properties
const defaultContainerStyle = {
  backgroundColor: '#FFFFFF',
  borderColor: '#000000',
  borderWidth: 1,
  padding: 8,
  backgroundOpacity: 1,
  borderOpacity: 1
}

const defaultTextStyle = {
  color: '#000000',
  fontSize: 14,
  fontFamily: 'Arial',
  fontWeight: 'normal',
  textAlign: 'center' as const
}

const defaultShapeStyle = {
  strokeColor: '#000000',
  strokeOpacity: 1,
  strokeWeight: 2,
  fillColor: '#FFFFFF',
  fillOpacity: 0.5
}

/**
 * Serializes a MapOverlay object for storage
 * Ensures all required properties are present and properly formatted
 */
export function serializeOverlay(overlay: MapOverlay): MapOverlay {
  const serialized: MapOverlay = {
    id: overlay.id,
    type: overlay.type,
    position: {
      lat: typeof overlay.position.lat === 'function' ? overlay.position.lat() : overlay.position.lat,
      lng: typeof overlay.position.lng === 'function' ? overlay.position.lng() : overlay.position.lng,
    },
    properties: {
      ...overlay.properties,
      // Ensure width is always set
      width: overlay.properties.width || 200,
      // Ensure zIndex is always set
      zIndex: overlay.properties.zIndex || 0,
      // Ensure draggable is always set
      draggable: overlay.properties.draggable !== false
    }
  }

  // Add type-specific defaults
  switch (overlay.type) {
    case 'image':
      serialized.properties = {
        ...serialized.properties,
        url: overlay.properties.url || '',
        width: overlay.properties.width || 200,
        height: overlay.properties.height,
        containerStyle: {
          ...defaultContainerStyle,
          ...overlay.properties.containerStyle
        }
      }
      break

    case 'text':
      serialized.properties = {
        ...serialized.properties,
        content: overlay.properties.content || '',
        containerStyle: {
          ...defaultContainerStyle,
          ...overlay.properties.containerStyle
        },
        textStyle: {
          ...defaultTextStyle,
          ...overlay.properties.textStyle
        },
        style: {
          color: overlay.properties.style?.color ?? '#000000',
          fontSize: overlay.properties.style?.fontSize ?? 14,
          fontFamily: overlay.properties.style?.fontFamily ?? 'Arial',
          backgroundColor: overlay.properties.style?.backgroundColor ?? '#FFFFFF',
          backgroundOpacity: overlay.properties.style?.backgroundOpacity ?? 1,
          borderColor: overlay.properties.style?.borderColor ?? '#000000',
          borderOpacity: overlay.properties.style?.borderOpacity ?? 1,
          borderWidth: overlay.properties.style?.borderWidth ?? 1,
          padding: overlay.properties.style?.padding ?? 8,
          scale: overlay.properties.style?.scale ?? 1,
          width: overlay.properties.style?.width ?? 80,
          height: overlay.properties.style?.height,
        }
      }
      break

    case 'shape':
      serialized.properties = {
        ...serialized.properties,
        paths: overlay.properties.paths || [],
        style: {
          ...defaultShapeStyle,
          ...overlay.properties.style
        }
      }
      break

    case 'group':
      serialized.properties = {
        ...serialized.properties,
        children: overlay.properties.children || [],
        containerStyle: {
          ...defaultContainerStyle,
          ...overlay.properties.containerStyle
        }
      }
      break

    case 'business':
      serialized.properties = {
        ...serialized.properties,
        businessName: overlay.properties.businessName || '',
        logo: overlay.properties.logo || '',
        containerStyle: {
          ...defaultContainerStyle,
          ...overlay.properties.containerStyle
        }
      }
      break
  }

  return serialized
}

/**
 * Deserializes a stored MapOverlay object
 * Ensures all properties are properly initialized with defaults
 */
export function deserializeOverlay(data: any): MapOverlay {
  return normalizeOverlay(data)
}

/**
 * Validates an overlay's position
 * Ensures lat/lng are within valid ranges
 */
export function validatePosition(position: { lat: number; lng: number }): boolean {
  return (
    typeof position.lat === 'number' &&
    typeof position.lng === 'number' &&
    position.lat >= -90 &&
    position.lat <= 90 &&
    position.lng >= -180 &&
    position.lng <= 180
  )
}

/**
 * Validates an overlay's style properties
 * Ensures colors are valid hex codes and numeric values are within ranges
 */
export function validateStyle(style: any): boolean {
  if (!style) return false

  // Validate color properties
  const colorProps = ['backgroundColor', 'borderColor', 'color', 'strokeColor', 'fillColor']
  for (const prop of colorProps) {
    if (style[prop] && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(style[prop])) {
      return false
    }
  }

  // Validate opacity properties
  const opacityProps = ['backgroundOpacity', 'borderOpacity', 'strokeOpacity', 'fillOpacity']
  for (const prop of opacityProps) {
    if (style[prop] !== undefined && (typeof style[prop] !== 'number' || style[prop] < 0 || style[prop] > 1)) {
      return false
    }
  }

  // Validate numeric properties
  const numericProps = ['borderWidth', 'padding', 'fontSize', 'strokeWeight']
  for (const prop of numericProps) {
    if (style[prop] !== undefined && (typeof style[prop] !== 'number' || style[prop] < 0)) {
      return false
    }
  }

  return true
}

const DEFAULT_TEXT_STYLE = {
  color: '#000000',
  fontSize: 14,
  fontFamily: 'Arial',
  fontWeight: 'normal',
  textAlign: 'center' as const,
}

const DEFAULT_CONTAINER_STYLE = {
  backgroundColor: '#FFFFFF',
  backgroundOpacity: 1,
  borderColor: '#000000',
  borderOpacity: 1,
  borderWidth: 1,
  padding: 8,
  scale: 1,
  width: 80,
}

const DEFAULT_SHAPE_STYLE = {
  strokeColor: '#000000',
  strokeOpacity: 1,
  strokeWeight: 2,
  fillColor: '#FFFFFF',
  fillOpacity: 0.5,
}

export function normalizeOverlay(overlay: MapOverlay): MapOverlay {
  const base = {
    ...overlay,
    position: {
      lat: typeof overlay.position.lat === 'function' ? overlay.position.lat() : overlay.position.lat,
      lng: typeof overlay.position.lng === 'function' ? overlay.position.lng() : overlay.position.lng,
    },
    properties: {
      ...overlay.properties,
      zIndex: overlay.properties.zIndex ?? 0,
      draggable: overlay.properties.draggable !== false
    },
  }

  switch (overlay.type) {
    case 'text':
      return {
        ...base,
        properties: {
          ...base.properties,
          content: base.properties.content || '',
          style: {
            ...DEFAULT_CONTAINER_STYLE,
            ...DEFAULT_TEXT_STYLE,
            ...base.properties.style,
          }
        }
      }

    case 'image':
      return {
        ...base,
        properties: {
          ...base.properties,
          url: base.properties.url || '',
          width: base.properties.width || 200,
          height: base.properties.height || 150,
          style: {
            ...DEFAULT_CONTAINER_STYLE,
            ...base.properties.style
          }
        }
      }

    case 'shape':
      return {
        ...base,
        properties: {
          ...base.properties,
          paths: base.properties.paths || [],
          style: {
            ...DEFAULT_SHAPE_STYLE,
            ...base.properties.style
          }
        }
      }

    case 'business':
      return {
        ...base,
        properties: {
          ...base.properties,
          businessName: base.properties.businessName || '',
          logo: base.properties.logo || '',
          style: {
            ...DEFAULT_CONTAINER_STYLE,
            ...base.properties.style
          }
        }
      }

    case 'group':
      return {
        ...base,
        properties: {
          ...base.properties,
          children: base.properties.children || [],
          style: {
            ...DEFAULT_CONTAINER_STYLE,
            ...base.properties.style
          }
        }
      }

    default:
      return base
  }
}

function saveMapToDatabase(mapData) {
  const overlaysToSave = mapData.overlays.map(serializeOverlay)
  // Store overlaysToSave in your DB
}

function loadMapFromDatabase(savedData) {
  const overlays = savedData.overlays.map(deserializeOverlay)
  // Use overlays to render on the map
} 