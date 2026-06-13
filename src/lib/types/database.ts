/**
 * Typed schema for the Supabase client. Mirrors schema.sql.
 * Run `npx supabase gen types typescript --project-id <id> > src/lib/types/database.ts`
 * to regenerate from a live project; this hand-authored version keeps the app
 * fully typed in the meantime.
 */

export type UserRole = 'user' | 'seller' | 'agent' | 'admin'
export type PropertyTypeDB = 'land' | 'house' | 'apartment' | 'commercial'
export type ListingTypeDB = 'sale' | 'rent'
export type ListingStatusDB = 'draft' | 'pending' | 'active' | 'sold' | 'rented' | 'expired'
export type VerificationLevelDB = 'none' | 'email' | 'verified' | 'premium'
export type LandSizeUnitDB = 'perch' | 'acre' | 'sqft'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          whatsapp: string | null
          role: UserRole
          verification_level: VerificationLevelDB
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: { id: string; full_name?: string | null; avatar_url?: string | null; phone?: string | null; whatsapp?: string | null; bio?: string | null }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      districts: {
        Row: { id: number; name: string; province: string }
        Insert: { name: string; province: string }
        Update: Partial<{ name: string; province: string }>
        Relationships: []
      }
      properties: {
        Row: {
          id: string
          owner_id: string
          title: string
          slug: string
          description: string | null
          property_type: PropertyTypeDB
          listing_type: ListingTypeDB
          status: ListingStatusDB
          price: number
          price_per_unit: boolean
          negotiable: boolean
          amenities: string[]
          currency: string
          address: string | null
          city: string | null
          district: string | null
          province: string | null
          postal_code: string | null
          latitude: number | null
          longitude: number | null
          land_size: number | null
          land_size_unit: LandSizeUnitDB | null
          building_sqft: number | null
          contact_phone: string | null
          contact_whatsapp: string | null
          bedrooms: number | null
          bathrooms: number | null
          parking: number | null
          year_built: number | null
          is_featured: boolean
          featured_until: string | null
          view_count: number
          contact_count: number
          published_at: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          owner_id: string
          title: string
          slug: string
          description?: string | null
          property_type: PropertyTypeDB
          listing_type: ListingTypeDB
          status?: ListingStatusDB
          price: number
          price_per_unit?: boolean
          negotiable?: boolean
          amenities?: string[]
          currency?: string
          address?: string | null
          city?: string | null
          district?: string | null
          province?: string | null
          postal_code?: string | null
          latitude?: number | null
          longitude?: number | null
          land_size?: number | null
          land_size_unit?: LandSizeUnitDB | null
          building_sqft?: number | null
          contact_phone?: string | null
          contact_whatsapp?: string | null
          bedrooms?: number | null
          bathrooms?: number | null
          parking?: number | null
          year_built?: number | null
          published_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['properties']['Insert']>
        Relationships: [{ foreignKeyName: 'properties_owner_id_fkey'; columns: ['owner_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] }]
      }
      property_images: {
        Row: {
          id: string
          property_id: string
          url: string
          storage_path: string | null
          is_primary: boolean
          sort_order: number
          created_at: string
        }
        Insert: { property_id: string; url: string; storage_path?: string | null; is_primary?: boolean; sort_order?: number }
        Update: Partial<Database['public']['Tables']['property_images']['Insert']>
        Relationships: [{ foreignKeyName: 'property_images_property_id_fkey'; columns: ['property_id']; isOneToOne: false; referencedRelation: 'properties'; referencedColumns: ['id'] }]
      }
      saved_properties: {
        Row: { user_id: string; property_id: string; created_at: string }
        Insert: { user_id: string; property_id: string }
        Update: Partial<{ user_id: string; property_id: string }>
        Relationships: [{ foreignKeyName: 'saved_properties_property_id_fkey'; columns: ['property_id']; isOneToOne: false; referencedRelation: 'properties'; referencedColumns: ['id'] }, { foreignKeyName: 'saved_properties_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] }]
      }
      property_inquiries: {
        Row: {
          id: string
          property_id: string
          sender_id: string | null
          name: string
          email: string | null
          phone: string | null
          message: string
          created_at: string
        }
        Insert: { property_id: string; sender_id?: string | null; name: string; email?: string | null; phone?: string | null; message: string }
        Update: Partial<Database['public']['Tables']['property_inquiries']['Insert']>
        Relationships: [{ foreignKeyName: 'property_inquiries_property_id_fkey'; columns: ['property_id']; isOneToOne: false; referencedRelation: 'properties'; referencedColumns: ['id'] }, { foreignKeyName: 'property_inquiries_sender_id_fkey'; columns: ['sender_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] }]
      }
    }
    Views: Record<string, never>
    Functions: {
      increment_view_count: { Args: { p_id: string }; Returns: undefined }
      increment_contact_count: { Args: { p_id: string }; Returns: undefined }
      get_seller_stats: { Args: Record<string, never>; Returns: SellerStats[] }
      properties_within_radius: {
        Args: { p_lat: number; p_lng: number; p_radius_m?: number; p_limit?: number }
        Returns: Database['public']['Tables']['properties']['Row'][]
      }
    }
    Enums: {
      user_role: UserRole
      property_type: PropertyTypeDB
      listing_type: ListingTypeDB
      listing_status: ListingStatusDB
      verification_level: VerificationLevelDB
      land_size_unit: LandSizeUnitDB
    }
  }
}

export interface SellerStats {
  total_views: number
  total_saved: number
  total_leads: number
  active_listings: number
}
