import type { MetadataRoute } from 'next'
import { getAllActiveSlugs } from '@/lib/db/properties.repo'
import { SITE } from '@/lib/constants'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getAllActiveSlugs()
  const now = new Date()
  const staticRoutes = ['', '/properties', '/auth/login', '/auth/register'].map((p) => ({
    url: `${SITE.url}${p}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: p === '' ? 1 : 0.7,
  }))
  const listingRoutes = slugs.map((slug) => ({
    url: `${SITE.url}/properties/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))
  return [...staticRoutes, ...listingRoutes]
}
