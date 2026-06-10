import type { PropertyType } from '@/types/property'
import { Home, Trees, Building2, Store, type LucideIcon } from 'lucide-react'

export const SITE = {
  name: 'Estata',
  tagline: "Sri Lanka's intelligent property platform",
  description:
    'Buy, sell and rent land, houses and apartments across Sri Lanka. Verified listings, AI search and real market intelligence.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://estata-property-platform.vercel.app',
}

export const PROPERTY_TYPES: {
  value: PropertyType
  label: string
  icon: LucideIcon
}[] = [
  { value: 'house', label: 'Houses', icon: Home },
  { value: 'land', label: 'Land', icon: Trees },
  { value: 'apartment', label: 'Apartments', icon: Building2 },
  { value: 'commercial', label: 'Commercial', icon: Store },
]

export const DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle',
]

export const TRENDING_LOCATIONS = [
  { name: 'Colombo 5', district: 'Colombo', count: 482, img: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=70' },
  { name: 'Nugegoda', district: 'Colombo', count: 318, img: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=70' },
  { name: 'Kandy', district: 'Kandy', count: 274, img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=70' },
  { name: 'Galle', district: 'Galle', count: 211, img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=70' },
  { name: 'Negombo', district: 'Gampaha', count: 168, img: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&q=70' },
  { name: 'Ja-Ela', district: 'Gampaha', count: 142, img: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=70' },
]

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
] as const
