/** Format an LKR amount the way Sri Lankans read it: Lakhs / Crores aware,
 *  but kept simple and scannable on property cards. */
export function formatPrice(value: number, currency = 'LKR'): string {
  if (value >= 1_000_000_00) {
    // 100 million+ -> show in millions to keep it short
    return `${currency} ${(value / 1_000_000).toFixed(0)}M`
  }
  if (value >= 1_000_000) {
    const m = value / 1_000_000
    return `${currency} ${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `${currency} ${(value / 1_000).toFixed(0)}K`
  }
  return `${currency} ${value.toLocaleString('en-LK')}`
}

export function formatPriceFull(value: number, currency = 'LKR'): string {
  return `${currency} ${value.toLocaleString('en-LK')}`
}

export function formatLandSize(size: number | null, unit: string | null): string | null {
  if (!size) return null
  const label = unit === 'perch' ? 'P' : unit === 'acre' ? 'ac' : 'sqft'
  return `${size % 1 === 0 ? size : size.toFixed(2)} ${label}`
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const day = 86_400_000
  if (diff < day) return 'Today'
  if (diff < 2 * day) return 'Yesterday'
  if (diff < 7 * day) return `${Math.floor(diff / day)} days ago`
  if (diff < 30 * day) return `${Math.floor(diff / (7 * day))}w ago`
  return new Date(iso).toLocaleDateString('en-LK', { month: 'short', year: 'numeric' })
}
