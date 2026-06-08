export type PropertyType = 'land' | 'house' | 'apartment' | 'commercial'
export type ListingType = 'sale' | 'rent'
export type ListingStatus =
  | 'draft' | 'pending' | 'active' | 'sold' | 'rented' | 'expired'
export type VerificationLevel = 'none' | 'email' | 'verified' | 'premium'
export type LandSizeUnit = 'perch' | 'acre' | 'sqft'

export interface PropertyImage {
  id: string
  url: string
  is_primary: boolean
  sort_order: number
}

export interface SellerProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  whatsapp: string | null
  verification_level: VerificationLevel
}

export interface Property {
  id: string
  owner_id: string
  title: string
  slug: string
  description: string | null
  property_type: PropertyType
  listing_type: ListingType
  status: ListingStatus
  price: number
  price_per_unit: boolean
  currency: string
  address: string | null
  city: string | null
  district: string | null
  province: string | null
  latitude: number | null
  longitude: number | null
  land_size: number | null
  land_size_unit: LandSizeUnit | null
  building_sqft: number | null
  bedrooms: number | null
  bathrooms: number | null
  parking: number | null
  year_built: number | null
  is_featured: boolean
  view_count: number
  contact_count: number
  created_at: string
  property_images?: PropertyImage[]
  profiles?: SellerProfile | null
}

export interface ListingFilters {
  type?: PropertyType
  listing?: ListingType
  district?: string
  minPrice?: number
  maxPrice?: number
  beds?: number
  q?: string
  sort?: 'newest' | 'price_asc' | 'price_desc'
  page?: number
}
