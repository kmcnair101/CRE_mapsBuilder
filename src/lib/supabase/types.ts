export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          subscription_tier: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          subscription_tier?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          subscription_tier?: string
          created_at?: string
          updated_at?: string
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
          overlays: Json
          subject_property: Json
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
          overlays?: Json
          subject_property?: Json
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
          overlays?: Json
          subject_property?: Json
          thumbnail?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}