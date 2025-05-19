import { loader } from '@/lib/google-maps'
import type { MapStyleName } from './types'

interface InitMapConfig {
  container: HTMLElement
  center: { lat: number; lng: number }
  zoom: number
  mapStyle?: MapStyle
  disableDefaultUI?: boolean
  draggable?: boolean
  scrollwheel?: boolean
  mapTypeControl?: boolean
  streetViewControl?: boolean
  fullscreenControl?: boolean
  gestureHandling?: 'cooperative' | 'greedy' | 'none' | 'auto'
}


interface MapStyle {
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

export async function initMap(config: InitMapConfig): Promise<{ map: google.maps.Map }> {
  await loader.load()

  const map = new google.maps.Map(config.container, {
    center: config.center,
    zoom: config.zoom,
    disableDefaultUI: config.disableDefaultUI,
    draggable: config.draggable,
    scrollwheel: config.scrollwheel,
    mapTypeControl: config.mapTypeControl,
    streetViewControl: config.streetViewControl,
    fullscreenControl: config.fullscreenControl,
    gestureHandling: config.gestureHandling
  })

  if (config.mapStyle) {
    if (config.mapStyle.type === 'satellite') {
      map.setMapTypeId('satellite')
    } else if (config.mapStyle.type === 'terrain') {
      map.setMapTypeId('terrain')
    } else {
      map.setMapTypeId('roadmap')
    }
  }

  return { map }
}
