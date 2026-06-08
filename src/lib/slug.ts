/** URL-safe slug from a title plus a short unique suffix to avoid collisions. */
export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
  const suffix = Math.random().toString(36).slice(2, 7)
  return `${base || 'listing'}-${suffix}`
}
