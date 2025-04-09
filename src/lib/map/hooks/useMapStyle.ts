import { mapStyles } from '../styles'
import type { MapStyleName } from '../styles'

export function useMapStyle() {
  const getBaseStyles = () => [
    {
      featureType: 'poi',
      elementType: 'all',
      stylers: [{ visibility: 'off' }]
    }
  ]

  const handleMapStyleChange = (
    map: google.maps.Map | null,
    style: {
      type: MapStyleName | 'satellite' | 'terrain'
      hideLabels?: boolean
      hideStreetNames?: boolean
      hideHighwayLabels?: boolean
      hideAreaLabels?: boolean
      hideBusinessLabels?: boolean
      hideTransitLabels?: boolean
      hideWaterLabels?: boolean
      highlightHighways?: {
        color: string
        weight: number
      }
    }
  ) => {
    if (!map) return

    let styles = [...getBaseStyles()]

    // Apply base style
    if (style.type === 'satellite') {
      map.setMapTypeId('satellite')
    } else if (style.type === 'terrain') {
      map.setMapTypeId('terrain')
    } else {
      map.setMapTypeId('roadmap')
      styles = [...styles, ...mapStyles[style.type]]
    }

    // Apply label visibility settings
    if (style.hideLabels) {
      styles.push(
        {
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        },
        // Explicitly hide all types of labels
        {
          featureType: 'administrative',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'administrative.neighborhood',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'administrative.land_parcel',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'road',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'water',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'transit',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      )
    } else {
      // Individual label controls
      if (style.hideStreetNames) {
        styles.push({
          featureType: 'road',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        })
      }

      if (style.hideHighwayLabels) {
        styles.push({
          featureType: 'road.highway',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        })
      }

      if (style.hideAreaLabels) {
        styles.push(
          {
            featureType: 'administrative.locality',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'administrative.neighborhood',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'administrative.land_parcel',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        )
      }

      if (style.hideBusinessLabels) {
        styles.push({
          featureType: 'poi.business',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        })
      }

      if (style.hideTransitLabels) {
        styles.push({
          featureType: 'transit',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        })
      }

      if (style.hideWaterLabels) {
        styles.push({
          featureType: 'water',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        })
      }
    }

    // Apply highway highlighting
    if (style.highlightHighways) {
      const { color, weight } = style.highlightHighways
      
      styles.push(
        {
          featureType: 'road.highway',
          elementType: 'geometry.fill',
          stylers: [
            { color },
            { weight }
          ]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry.stroke',
          stylers: [
            { color },
            { weight }
          ]
        }
      )
    }

    map.setOptions({ styles })
  }

  return { handleMapStyleChange }
}