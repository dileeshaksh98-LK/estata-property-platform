'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Bath, BedDouble, Car, MapPin, Maximize, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { SaveButton } from './save-button'
import { formatPrice, formatLandSize, timeAgo } from '@/lib/format'
import type { Property } from '@/types/property'

export function PropertyCard({ property, priority = false }: { property: Property; priority?: boolean }) {
  const cover =
    property.property_images?.find((i) => i.is_primary)?.url ??
    property.property_images?.[0]?.url ??
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=70'

  const isRent = property.listing_type === 'rent'

  const stats: { icon: typeof BedDouble; label: string }[] = []
  if (property.bedrooms) stats.push({ icon: BedDouble, label: `${property.bedrooms}` })
  if (property.bathrooms) stats.push({ icon: Bath, label: `${property.bathrooms}` })
  if (property.parking) stats.push({ icon: Car, label: `${property.parking}` })
  if (property.land_size) {
    const s = formatLandSize(property.land_size, property.land_size_unit)
    if (s) stats.push({ icon: Maximize, label: s })
  } else if (property.building_sqft) {
    stats.push({ icon: Maximize, label: `${property.building_sqft.toLocaleString()} ft²` })
  }

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="group relative overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition-shadow hover:shadow-lift"
    >
      <Link href={`/properties/${property.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={cover}
            alt={property.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
            <div className="flex gap-2">
              {property.is_featured && (
                <Badge variant="featured">
                  <Sparkles className="size-3" /> Featured
                </Badge>
              )}
              {isRent && <Badge variant="rent">For Rent</Badge>}
            </div>
            <SaveButton id={property.id} />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4 pt-10">
            <p className="font-display text-2xl font-semibold text-white drop-shadow-sm">
              {formatPrice(property.price)}
              {isRent && <span className="text-sm font-normal text-white/85"> /mo</span>}
              {property.price_per_unit && (
                <span className="text-sm font-normal text-white/85"> /perch</span>
              )}
              {property.negotiable && (
                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 align-middle text-xs font-medium text-white/95 backdrop-blur-sm">Negotiable</span>
              )}
            </p>
          </div>
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/properties/${property.slug}`}>
          <h3 className="line-clamp-1 font-medium leading-snug transition-colors group-hover:text-primary">
            {property.title}
          </h3>
        </Link>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="line-clamp-1">
            {property.city}{property.district && property.city !== property.district ? `, ${property.district}` : ''}
          </span>
        </p>

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-3.5 text-sm text-muted-foreground">
            {stats.slice(0, 4).map((s, i) => (
              <span key={i} className="flex items-center gap-1">
                <s.icon className="size-4" /> {s.label}
              </span>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{timeAgo(property.created_at)}</span>
        </div>
      </div>
    </motion.article>
  )
}
