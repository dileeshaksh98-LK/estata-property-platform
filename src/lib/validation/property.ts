import { z } from 'zod'

export const propertyTypeEnum = z.enum(['land', 'house', 'apartment', 'commercial'])
export const listingTypeEnum = z.enum(['sale', 'rent'])
export const landUnitEnum = z.enum(['perch', 'acre', 'sqft'])

const imageSchema = z.object({
  url: z.string().url(),
  storage_path: z.string().optional(),
  is_primary: z.boolean().optional(),
  sort_order: z.number().int().optional(),
})

export const propertyInput = z.object({
  title: z.string().min(6, 'Title must be at least 6 characters').max(140),
  description: z.string().max(5000).optional().or(z.literal('')),
  property_type: propertyTypeEnum,
  listing_type: listingTypeEnum,
  price: z.coerce.number().positive('Price must be greater than zero').max(1e12),
  price_per_unit: z.boolean().optional(),
  district: z.string().min(1, 'District is required'),
  city: z.string().max(120).optional().or(z.literal('')),
  address: z.string().max(240).optional().or(z.literal('')),
  province: z.string().optional().or(z.literal('')),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  land_size: z.coerce.number().nonnegative().optional().nullable(),
  land_size_unit: landUnitEnum.optional(),
  building_sqft: z.coerce.number().nonnegative().optional().nullable(),
  bedrooms: z.coerce.number().int().nonnegative().max(50).optional().nullable(),
  bathrooms: z.coerce.number().int().nonnegative().max(50).optional().nullable(),
  parking: z.coerce.number().int().nonnegative().max(50).optional().nullable(),
  year_built: z.coerce.number().int().min(1800).max(2100).optional().nullable(),
  status: z.enum(['draft', 'active']).default('active'),
  contact_phone: z.string().max(40).optional().or(z.literal('')),
  contact_whatsapp: z.string().max(40).optional().or(z.literal('')),
  images: z.array(imageSchema).min(1, 'Add at least one photo').max(20),
})

export type PropertyInput = z.infer<typeof propertyInput>

export const propertyUpdateInput = propertyInput.partial().extend({ id: z.string().uuid() })
export type PropertyUpdateInput = z.infer<typeof propertyUpdateInput>

export const statusEnum = z.enum(['draft', 'active', 'sold', 'rented'])

/** Full edit payload: field updates + image add/remove/reorder + status. */
export const propertyEditInput = z.object({
  id: z.string().uuid(),
  title: z.string().min(6).max(140),
  description: z.string().max(5000).optional().or(z.literal('')),
  property_type: propertyTypeEnum,
  listing_type: listingTypeEnum,
  price: z.coerce.number().positive().max(1e12),
  district: z.string().min(1),
  city: z.string().max(120).optional().or(z.literal('')),
  address: z.string().max(240).optional().or(z.literal('')),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  land_size: z.coerce.number().nonnegative().optional().nullable(),
  bedrooms: z.coerce.number().int().nonnegative().max(50).optional().nullable(),
  bathrooms: z.coerce.number().int().nonnegative().max(50).optional().nullable(),
  parking: z.coerce.number().int().nonnegative().max(50).optional().nullable(),
  year_built: z.coerce.number().int().min(1800).max(2100).optional().nullable(),
  status: statusEnum,
  /** Final image set, in display order. Existing images carry their id. */
  images: z.array(z.object({
    id: z.string().optional(),
    url: z.string().url(),
    storage_path: z.string().nullable().optional(),
  })).min(1, 'Keep at least one photo').max(20),
})
export type PropertyEditInput = z.infer<typeof propertyEditInput>
