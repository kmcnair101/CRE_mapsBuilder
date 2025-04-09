import type { MapStyleName } from './map/styles'
import type { PlanType } from './stripe'

export interface ContainerStyle {
  backgroundColor: string
  borderColor: string
  borderWidth: number
  padding: number
  backgroundOpacity: number
  borderOpacity: number
}

export interface MapOverlay {
  id: string
  type: 'image' | 'text' | 'business' | 'group' | 'shape'
  position: {
    lat: number
    lng: number
  }
  properties: {
    // Common properties
    draggable?: boolean
    zIndex?: number
    width?: number
    // Image specific
    url?: string
    height?: number
    opacity?: number
    containerStyle?: ContainerStyle
    // Text specific
    content?: string
    fontSize?: number
    fontFamily?: string
    color?: string
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
    borderRadius?: number
    padding?: number
    backgroundOpacity?: number
    borderOpacity?: number
    // Business specific
    businessName?: string
    logo?: string
    address?: string
    // Group specific
    title?: string
    items?: Array<{
      id: string
      type: 'image' | 'logo'
      url: string
      width: number
      height: number
    }>
    // Shape specific
    shapeType?: 'rect' | 'circle' | 'polygon'
    fill?: string
    stroke?: string
    strokeWidth?: number
    shapeOpacity?: number
    shapeWidth?: number
    shapeHeight?: number
    radius?: number
    points?: Array<{
      lat: number
      lng: number
    }>
  }
}

export interface MapData {
  title: string
  center_lat: number
  center_lng: number
  zoom_level: number
  overlays: MapOverlay[]
  subject_property: {
    address: string
    lat: number
    lng: number
    name?: string
    image?: string | null
    style?: {
      color: string
      fontSize: number
      fontFamily: string
      backgroundColor: string
      borderColor: string
      borderWidth: number
      padding: number
      backgroundOpacity: number
      borderOpacity: number
    }
  } | null
  mapStyle?: {
    type: MapStyleName | 'satellite' | 'terrain'
    customStyles?: google.maps.MapTypeStyle[]
    hideLabels?: boolean
    hideStreetNames?: boolean
    hidePOIs?: boolean
    highlightHighways?: {
      color: string
      opacity: number
    }
  }
}

export interface Profile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  company?: string
  website?: string
  avatar_url?: string
  company_logo_url?: string
  subscription_tier: PlanType
  subscription_id?: string
  trial_ends_at?: string
  profile_completed: boolean
}