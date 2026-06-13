import type { MetadataRoute } from 'next'
import { getAllActiveSlugs } from '@/lib/db/properties.repo'
import { getIndexableComboKeys, MIN_INDEXABLE } from '@/lib/db/seo.repo'
import { SEO_INTENTS, districtToSlug } from '@/lib/seo/intents'
import { SITE } from '@/lib/constants'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const [slugs, indexableKeys] = await Promise.all([
    getAllActiveSlugs(),
    getIndexableComboKeys(MIN_INDEXABLE),
  ])

  // Static content pages (auth pages intentionally excluded from the sitemap).
  const staticRoutes = ['', '/properties', '/about', '/how-it-works', '/contact', '/privacy', '/terms'].map((p) => ({
    url: `${SITE.url}${p}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: p === '' ? 1 : 0.6,
  }))

  // Individual active listings — the primary SEO surface.
  const listingRoutes = slugs.map((slug) => ({
    url: `${SITE.url}/properties/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Programmatic district x intent pages — only those with enough live inventory
  // to be indexable (matches the page-level noindex gate).
  const programmaticRoutes: MetadataRoute.Sitemap = []
  for (const key of indexableKeys) {
    const [district, propertyType, listingType] = key.split('|')
    const intent = SEO_INTENTS.find((i) => i.propertyType === propertyType && i.listingType === listingType)
    if (!intent) continue
    programmaticRoutes.push({
      url: `${SITE.url}/${districtToSlug(district)}/${intent.slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })
  }

  return [...staticRoutes, ...listingRoutes, ...programmaticRoutes]
}
