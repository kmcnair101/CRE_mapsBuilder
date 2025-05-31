// import type { MapStyleName } from './map/styles'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

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
    width?: number
    height?: number
    draggable?: boolean
    zIndex?: number
    
    // Type-specific properties
    url?: string
    content?: string
    businessName?: string
    address?: string
    logo?: string
    paths?: google.maps.LatLngLiteral[]
    children?: MapOverlay[]
    
    // Style properties
    containerStyle?: ContainerStyle
    textStyle?: {
      color: string
      fontSize: number
      fontFamily: string
      fontWeight: string
      textAlign: 'left' | 'center' | 'right'
    }
    style?: {
      strokeColor: string
      strokeOpacity: number
      strokeWeight: number
      fillColor: string
      fillOpacity: number
    }
  }
}

export interface MapData {
  title: string
  center_lat: number
  center_lng: number
  zoom_level: number
  overlays: MapOverlay[]
  subject_property: {
    lat: number
    lng: number
    name: string
    image: string | null
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
    address: string
  } | null
  mapStyle?: {
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
    customStyles?: google.maps.MapTypeStyle[]
  }
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          company_name: string | null
          phone: string | null
          created_at: string
          updated_at: string
          subscription_status: string | null
          avatar_url: string | null
          first_name: string | null
          last_name: string | null
          website: string | null
        }
        Insert: {
          id: string
          email: string
          company_name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
          subscription_status?: string | null
          avatar_url?: string | null
          first_name?: string | null
          last_name?: string | null
          website?: string | null
        }
        Update: {
          id?: string
          email?: string
          company_name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
          subscription_status?: string | null
          avatar_url?: string | null
          first_name?: string | null
          last_name?: string | null
          website?: string | null
        }
      }

      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_subscription_id: string
          stripe_price_id: string
          status: string
          current_period_start: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_subscription_id: string
          stripe_price_id: string
          status: string
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_subscription_id?: string
          stripe_price_id?: string
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      payment_records: {
        Row: {
          id: string
          user_id: string
          subscription_id: string | null
          stripe_payment_id: string | null
          amount: number | null
          currency: string | null
          status: string | null
          payment_method: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id?: string | null
          stripe_payment_id?: string | null
          amount?: number | null
          currency?: string | null
          status?: string | null
          payment_method?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subscription_id?: string | null
          stripe_payment_id?: string | null
          amount?: number | null
          currency?: string | null
          status?: string | null
          payment_method?: string | null
          created_at?: string
        }
      }

      maps: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          center_lat: number
          center_lng: number
          zoom_level: number
          overlays: Json | null
          subject_property: Json | null
          thumbnail: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          center_lat: number
          center_lng: number
          zoom_level?: number
          overlays?: Json | null
          subject_property?: Json | null
          thumbnail?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          center_lat?: number
          center_lng?: number
          zoom_level?: number
          overlays?: Json | null
          subject_property?: Json | null
          thumbnail?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type MapStyleName = 'default' | 'subtle' | 'light' | 'dark' | 'retro' | 'silver' | 'night';
