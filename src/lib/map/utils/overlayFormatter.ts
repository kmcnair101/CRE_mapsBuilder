import type { MapOverlay } from '@/lib/types'

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
      lat: overlay.position.lat,
      lng: overlay.position.lng
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
  // Basic validation
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid overlay data')
  }

  if (!data.id || !data.type || !data.position) {
    throw new Error('Missing required overlay properties')
  }

  // Start with the serialized data
  const overlay = serializeOverlay(data as MapOverlay)

  // Additional validation and cleanup
  if (overlay.type === 'shape' && (!overlay.properties.paths || !Array.isArray(overlay.properties.paths))) {
    overlay.properties.paths = []
  }

  if (overlay.type === 'group' && (!overlay.properties.children || !Array.isArray(overlay.properties.children))) {
    overlay.properties.children = []
  }

  return overlay
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