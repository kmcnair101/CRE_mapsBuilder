import type { MapOverlay } from '@/lib/types'

const DEFAULT_SHAPE_STYLE = {
  strokeColor: '#000000',
  strokeOpacity: 1,
  strokeWeight: 2,
  fillColor: '#FFFFFF',
  fillOpacity: 0.5
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
    }
  }

  switch (overlay.type) {
    case 'shape':
      return {
        ...base,
        properties: {
          ...base.properties,
          shapeType: base.properties.shapeType,
          style: {
            ...DEFAULT_SHAPE_STYLE,
            fillColor: base.properties.style?.fillColor || base.properties.fill || DEFAULT_SHAPE_STYLE.fillColor,
            strokeColor: base.properties.style?.strokeColor || base.properties.stroke || DEFAULT_SHAPE_STYLE.strokeColor,
            strokeWeight: base.properties.style?.strokeWeight || base.properties.strokeWidth || DEFAULT_SHAPE_STYLE.strokeWeight,
            fillOpacity: base.properties.style?.fillOpacity || base.properties.shapeOpacity || DEFAULT_SHAPE_STYLE.fillOpacity,
            strokeOpacity: base.properties.style?.strokeOpacity || DEFAULT_SHAPE_STYLE.strokeOpacity
          },
          ...(base.properties.shapeWidth && { shapeWidth: base.properties.shapeWidth }),
          ...(base.properties.shapeHeight && { shapeHeight: base.properties.shapeHeight }),
          ...(base.properties.radius && { radius: base.properties.radius }),
          ...(base.properties.points && { points: base.properties.points })
        }
      }

    default:
      return base
  }
} 